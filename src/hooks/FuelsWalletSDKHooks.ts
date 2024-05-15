import { Fuel } from "@fuel-wallet/sdk";

export const useFuel = () => {
  let instance: Fuel | null;

  // This function initializes the instance if it doesn't exist
  async function createInstance() {
    const fuel = new Fuel();
    await fuel.connect();
    return fuel;
  }

  return async () => {
    if (!instance) {
      instance = await createInstance();
    }
    return instance;
  };
};
