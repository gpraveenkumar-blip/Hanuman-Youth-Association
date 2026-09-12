let appPromise: Promise<any> | undefined;

function getApp() {
  if (!appPromise) {
    appPromise = import("../backend/src/server.js").then((module) => {
      return module.default;
    });
  }

  return appPromise;
}

export default async function handler(req: any, res: any) {
  const app = await getApp();
  return app(req, res);
}