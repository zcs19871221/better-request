export default function wait(ms: number): Promise<undefined> {
  return new Promise(resolve =>
    setTimeout(() => {
      resolve();
    }, ms),
  );
}
