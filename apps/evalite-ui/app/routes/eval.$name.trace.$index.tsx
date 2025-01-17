import { getEvalResult } from "@evalite/core/sdk";
import {
  Link,
  NavLink,
  useLoaderData,
  useSearchParams,
  type ClientLoaderFunctionArgs,
} from "@remix-run/react";
import { SidebarCloseIcon } from "lucide-react";
import type React from "react";
import { useContext } from "react";
import { DisplayInput } from "~/components/display-input";
import { getScoreState, Score } from "~/components/score";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
} from "~/components/ui/breadcrumb";
import { Button } from "~/components/ui/button";
import { Separator } from "~/components/ui/separator";
import { SidebarContent, SidebarHeader } from "~/components/ui/sidebar";
import { cn } from "~/lib/utils";
import { TestServerStateContext } from "~/use-subscribe-to-socket";

const SidebarSection = ({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) => (
  <div className="text-sm">
    <div>
      <h2 className="font-semibold text-base">{title}</h2>
      {description && <p className="text-gray-500 text-xs">{description}</p>}
    </div>
    <div className="mt-1">{children}</div>
  </div>
);

export const clientLoader = async (args: ClientLoaderFunctionArgs) => {
  const data = await getEvalResult({
    name: args.params.name!,
    resultIndex: args.params.index!,
  });

  return { data, name: args.params.name!, resultIndex: args.params.index! };
};

export default function Page() {
  const {
    data: { result, prevResult, filepath },
    name,
    resultIndex,
  } = useLoaderData<typeof clientLoader>();

  const serverState = useContext(TestServerStateContext);

  const isRunning =
    serverState.state.type === "running" &&
    serverState.state.filepaths.has(filepath);

  const [searchParams] = useSearchParams();

  const startTime = result.traces[0]?.start ?? 0;
  const endTime = result.traces[result.traces.length - 1]?.end ?? 0;
  const totalTraceDuration = endTime - startTime;

  return (
    <>
      <SidebarHeader>
        <div className="flex items-center gap-3">
          <Button size={"icon"} variant="ghost" asChild>
            <Link to={`/eval/${name}`} preventScrollReset>
              <SidebarCloseIcon className="size-5 rotate-180" />
            </Link>
          </Button>
          <div>
            <span className="text-primary block font-semibold mb-1">Trace</span>
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <Score
                    isRunning={isRunning}
                    score={result.score}
                    state={getScoreState(result.score, prevResult?.score)}
                  />
                </BreadcrumbItem>
                <Separator orientation="vertical" className="mx-1 h-4" />
                <BreadcrumbItem>{result.duration}ms</BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </div>
        <Separator className="mt-2" />
      </SidebarHeader>
      <SidebarContent className="p-2 pb-8 flex flex-row h-full">
        <div className="w-44 flex flex-col gap-3 flex-shrink-0">
          <Trace
            title="Eval"
            startPercent={0}
            endPercent={100}
            href={`/eval/${name}/trace/${resultIndex}`}
            isActive={!searchParams.get("trace")}
          />
          {result.traces.map((trace, traceIndex) => {
            const startTimeWithinTrace = trace.start - startTime;
            const endTimeWithinTrace = trace.end - startTime;

            const startPercent =
              (startTimeWithinTrace / totalTraceDuration) * 100;
            const endPercent = (endTimeWithinTrace / totalTraceDuration) * 100;
            return (
              <Trace
                title={`Trace ${traceIndex + 1}`}
                href={`/eval/${name}/trace/${resultIndex}?trace=${traceIndex}`}
                endPercent={endPercent}
                startPercent={startPercent}
                isActive={searchParams.get("trace") === String(traceIndex)}
              ></Trace>
            );
          })}
          {result.traces.length === 0 && (
            <span className="text-xs block text-gray-500 text-center text-balance">
              Use <code>reportTrace</code> to capture traces.
            </span>
          )}
        </div>
        <div className="flex-grow border-l pl-4">
          {!searchParams.get("trace") && (
            <>
              <DisplayTraceData
                input={result.input}
                expected={result.expected}
                result={result.result}
              />
              {result.scores.map((score) => (
                <>
                  <Separator className="my-4" />
                  <SidebarSection
                    key={score.name}
                    title={score.name}
                    description={score.description}
                  >
                    <Score
                      isRunning={isRunning}
                      score={score.score ?? 0}
                      state={getScoreState(
                        score.score ?? 0,
                        prevResult?.scores.find(
                          (prevScore) => prevScore.name === score.name
                        )?.score
                      )}
                    />
                  </SidebarSection>
                </>
              ))}
            </>
          )}
          {searchParams.get("trace") && (
            <>
              <DisplayTraceData
                input={result.traces[Number(searchParams.get("trace"))]?.input}
                expected={undefined}
                result={
                  result.traces[Number(searchParams.get("trace"))]?.output
                }
              />
            </>
          )}
        </div>
      </SidebarContent>
    </>
  );
}

const DisplayTraceData = (props: {
  input: unknown;
  expected: unknown | undefined;
  result: unknown;
}) => {
  return (
    <>
      <SidebarSection title="Input">
        <DisplayInput
          shouldTruncateText={false}
          input={props.input}
        ></DisplayInput>
      </SidebarSection>
      <Separator className="my-4" />
      {props.expected ? (
        <>
          <SidebarSection title="Expected">
            <DisplayInput
              shouldTruncateText={false}
              input={props.expected}
            ></DisplayInput>
          </SidebarSection>
          <Separator className="my-4" />
        </>
      ) : null}
      <SidebarSection title="Output">
        <DisplayInput
          shouldTruncateText={false}
          input={props.result}
        ></DisplayInput>
      </SidebarSection>
    </>
  );
};

const Trace = (props: {
  title: string;
  /**
   * Number between 0 and 100
   */
  startPercent: number;
  /*
   * Number between 0 and 100
   */
  endPercent: number;
  href: string;
  isActive: boolean;
}) => {
  const length = props.endPercent - props.startPercent;

  return (
    <NavLink
      to={props.href}
      className={cn(
        "px-2 py-2 hover:bg-gray-100 transition-colors",
        props.isActive && "bg-gray-200 hover:bg-gray-200"
      )}
      end
    >
      <span className="block text-sm mb-1">{props.title}</span>
      <div className="relative w-full">
        <div
          className={cn(
            "w-full rounded-full h-1 bg-gray-200 transition-colors",
            props.isActive && "bg-gray-300"
          )}
        ></div>
        <div
          className="absolute top-0 w-full rounded-full h-1 bg-gray-500"
          style={{
            left: `${props.startPercent}%`,
            width: `${length}%`,
          }}
        ></div>
      </div>
    </NavLink>
  );
};
