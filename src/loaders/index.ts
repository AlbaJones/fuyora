import repositoriesLoader from "./repositories";

export default async (container: any): Promise<void> => {
  await repositoriesLoader(container);
};
