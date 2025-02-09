/* Autogenerated file. Do not edit manually. */

/* eslint-disable max-classes-per-file */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/consistent-type-imports */

/*
  Fuels version: 0.94.5
*/

import { ContractFactory, decompressBytecode } from "fuels";
import type { Provider, Account, DeployContractOptions, DeployContractResult } from "fuels";

import { Manifold } from "./Manifold";

const bytecode = decompressBytecode("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");

export class ManifoldFactory extends ContractFactory {

  static readonly bytecode = bytecode;

  constructor(accountOrProvider: Account | Provider) {
    super(bytecode, Manifold.abi, accountOrProvider);
  }

  static async deploy (
    wallet: Account,
    options: DeployContractOptions = {}
  ): Promise<DeployContractResult<Manifold>> {
    const factory = new ManifoldFactory(wallet);

    return factory.deploy({
      storageSlots: Manifold.storageSlots,
      ...options,
    });
  }
}
