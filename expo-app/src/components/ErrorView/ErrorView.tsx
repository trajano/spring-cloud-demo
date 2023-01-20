import { memo } from "react";

import { SimpleErrorView } from "./SimpleErrorView";
import { StackTraceErrorView } from "./StackTraceErrorView";
import type { StyleProps } from "../../lib/native-unstyled";
type ErrorViewProps = StyleProps & {
  exception: unknown;
};

/** This is a error view that will take up the full area that is given to it. */
export const ErrorView = memo(({ exception }: ErrorViewProps) => {
  if (!exception) {
    return <SimpleErrorView message="Exception passed was null or undefined" />;
  } else if (typeof exception === "object") {
    if (exception instanceof Error) {
      return <StackTraceErrorView exception={exception} />;
    } else {
      return <SimpleErrorView message={exception.toString()} />;
    }
  } else {
    return <SimpleErrorView message={exception.toString()} />;
  }
});
