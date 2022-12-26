global.Promise = require("promise");

require("promise/lib/rejection-tracking").enable({
  allRejections: true,
  onUnhandled: (id: number, error: unknown) => {
    if (typeof error === "object" && error instanceof Error) {
      // not bothering with the stack because it's useless.
      console.error({
        name: error.name,
        message: error.message,
        cause: error.cause,
      });
    } else {
      console.error(
        id,
        error,
        typeof error === "object",
        error instanceof Error
      );
    }
  },
});
