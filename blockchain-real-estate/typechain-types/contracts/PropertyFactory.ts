/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */
import type {
  BaseContract,
  BigNumber,
  BigNumberish,
  BytesLike,
  CallOverrides,
  ContractTransaction,
  Overrides,
  PopulatedTransaction,
  Signer,
  utils,
} from "ethers";
import type {
  FunctionFragment,
  Result,
  EventFragment,
} from "@ethersproject/abi";
import type { Listener, Provider } from "@ethersproject/providers";
import type {
  TypedEventFilter,
  TypedEvent,
  TypedListener,
  OnEvent,
  PromiseOrValue,
} from "../common";

export declare namespace PropertyFactory {
  export type PropertyInfoStruct = {
    tokenAddress: PromiseOrValue<string>;
    isApproved: PromiseOrValue<boolean>;
  };

  export type PropertyInfoStructOutput = [string, boolean] & {
    tokenAddress: string;
    isApproved: boolean;
  };
}

export interface PropertyFactoryInterface extends utils.Interface {
  functions: {
    "approveProperty(address)": FunctionFragment;
    "approvedProperties(address)": FunctionFragment;
    "createProperty(string,string,string,string,uint256)": FunctionFragment;
    "eurcTokenAddress()": FunctionFragment;
    "getPropertyCreators()": FunctionFragment;
    "getPropertyStatus(address)": FunctionFragment;
    "getUserProperties(address)": FunctionFragment;
    "owner()": FunctionFragment;
    "rejectProperty(address)": FunctionFragment;
    "renounceOwnership()": FunctionFragment;
    "transferOwnership(address)": FunctionFragment;
    "updateEURCToken(address)": FunctionFragment;
    "userProperties(address,uint256)": FunctionFragment;
  };

  getFunction(
    nameOrSignatureOrTopic:
      | "approveProperty"
      | "approvedProperties"
      | "createProperty"
      | "eurcTokenAddress"
      | "getPropertyCreators"
      | "getPropertyStatus"
      | "getUserProperties"
      | "owner"
      | "rejectProperty"
      | "renounceOwnership"
      | "transferOwnership"
      | "updateEURCToken"
      | "userProperties"
  ): FunctionFragment;

  encodeFunctionData(
    functionFragment: "approveProperty",
    values: [PromiseOrValue<string>]
  ): string;
  encodeFunctionData(
    functionFragment: "approvedProperties",
    values: [PromiseOrValue<string>]
  ): string;
  encodeFunctionData(
    functionFragment: "createProperty",
    values: [
      PromiseOrValue<string>,
      PromiseOrValue<string>,
      PromiseOrValue<string>,
      PromiseOrValue<string>,
      PromiseOrValue<BigNumberish>
    ]
  ): string;
  encodeFunctionData(
    functionFragment: "eurcTokenAddress",
    values?: undefined
  ): string;
  encodeFunctionData(
    functionFragment: "getPropertyCreators",
    values?: undefined
  ): string;
  encodeFunctionData(
    functionFragment: "getPropertyStatus",
    values: [PromiseOrValue<string>]
  ): string;
  encodeFunctionData(
    functionFragment: "getUserProperties",
    values: [PromiseOrValue<string>]
  ): string;
  encodeFunctionData(functionFragment: "owner", values?: undefined): string;
  encodeFunctionData(
    functionFragment: "rejectProperty",
    values: [PromiseOrValue<string>]
  ): string;
  encodeFunctionData(
    functionFragment: "renounceOwnership",
    values?: undefined
  ): string;
  encodeFunctionData(
    functionFragment: "transferOwnership",
    values: [PromiseOrValue<string>]
  ): string;
  encodeFunctionData(
    functionFragment: "updateEURCToken",
    values: [PromiseOrValue<string>]
  ): string;
  encodeFunctionData(
    functionFragment: "userProperties",
    values: [PromiseOrValue<string>, PromiseOrValue<BigNumberish>]
  ): string;

  decodeFunctionResult(
    functionFragment: "approveProperty",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "approvedProperties",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "createProperty",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "eurcTokenAddress",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "getPropertyCreators",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "getPropertyStatus",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "getUserProperties",
    data: BytesLike
  ): Result;
  decodeFunctionResult(functionFragment: "owner", data: BytesLike): Result;
  decodeFunctionResult(
    functionFragment: "rejectProperty",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "renounceOwnership",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "transferOwnership",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "updateEURCToken",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "userProperties",
    data: BytesLike
  ): Result;

  events: {
    "EURCTokenUpdated(address)": EventFragment;
    "OwnershipTransferred(address,address)": EventFragment;
    "PropertyApproved(address)": EventFragment;
    "PropertyRejected(address)": EventFragment;
    "PropertySubmitted(address,address)": EventFragment;
  };

  getEvent(nameOrSignatureOrTopic: "EURCTokenUpdated"): EventFragment;
  getEvent(nameOrSignatureOrTopic: "OwnershipTransferred"): EventFragment;
  getEvent(nameOrSignatureOrTopic: "PropertyApproved"): EventFragment;
  getEvent(nameOrSignatureOrTopic: "PropertyRejected"): EventFragment;
  getEvent(nameOrSignatureOrTopic: "PropertySubmitted"): EventFragment;
}

export interface EURCTokenUpdatedEventObject {
  newAddress: string;
}
export type EURCTokenUpdatedEvent = TypedEvent<
  [string],
  EURCTokenUpdatedEventObject
>;

export type EURCTokenUpdatedEventFilter =
  TypedEventFilter<EURCTokenUpdatedEvent>;

export interface OwnershipTransferredEventObject {
  previousOwner: string;
  newOwner: string;
}
export type OwnershipTransferredEvent = TypedEvent<
  [string, string],
  OwnershipTransferredEventObject
>;

export type OwnershipTransferredEventFilter =
  TypedEventFilter<OwnershipTransferredEvent>;

export interface PropertyApprovedEventObject {
  tokenAddress: string;
}
export type PropertyApprovedEvent = TypedEvent<
  [string],
  PropertyApprovedEventObject
>;

export type PropertyApprovedEventFilter =
  TypedEventFilter<PropertyApprovedEvent>;

export interface PropertyRejectedEventObject {
  tokenAddress: string;
}
export type PropertyRejectedEvent = TypedEvent<
  [string],
  PropertyRejectedEventObject
>;

export type PropertyRejectedEventFilter =
  TypedEventFilter<PropertyRejectedEvent>;

export interface PropertySubmittedEventObject {
  owner: string;
  tokenAddress: string;
}
export type PropertySubmittedEvent = TypedEvent<
  [string, string],
  PropertySubmittedEventObject
>;

export type PropertySubmittedEventFilter =
  TypedEventFilter<PropertySubmittedEvent>;

export interface PropertyFactory extends BaseContract {
  connect(signerOrProvider: Signer | Provider | string): this;
  attach(addressOrName: string): this;
  deployed(): Promise<this>;

  interface: PropertyFactoryInterface;

  queryFilter<TEvent extends TypedEvent>(
    event: TypedEventFilter<TEvent>,
    fromBlockOrBlockhash?: string | number | undefined,
    toBlock?: string | number | undefined
  ): Promise<Array<TEvent>>;

  listeners<TEvent extends TypedEvent>(
    eventFilter?: TypedEventFilter<TEvent>
  ): Array<TypedListener<TEvent>>;
  listeners(eventName?: string): Array<Listener>;
  removeAllListeners<TEvent extends TypedEvent>(
    eventFilter: TypedEventFilter<TEvent>
  ): this;
  removeAllListeners(eventName?: string): this;
  off: OnEvent<this>;
  on: OnEvent<this>;
  once: OnEvent<this>;
  removeListener: OnEvent<this>;

  functions: {
    approveProperty(
      _propertyAddress: PromiseOrValue<string>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<ContractTransaction>;

    approvedProperties(
      arg0: PromiseOrValue<string>,
      overrides?: CallOverrides
    ): Promise<[boolean]>;

    createProperty(
      _title: PromiseOrValue<string>,
      _description: PromiseOrValue<string>,
      _location: PromiseOrValue<string>,
      _imageUrl: PromiseOrValue<string>,
      _price: PromiseOrValue<BigNumberish>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<ContractTransaction>;

    eurcTokenAddress(overrides?: CallOverrides): Promise<[string]>;

    getPropertyCreators(overrides?: CallOverrides): Promise<[string[]]>;

    getPropertyStatus(
      _propertyAddress: PromiseOrValue<string>,
      overrides?: CallOverrides
    ): Promise<[boolean]>;

    getUserProperties(
      _user: PromiseOrValue<string>,
      overrides?: CallOverrides
    ): Promise<[PropertyFactory.PropertyInfoStructOutput[]]>;

    owner(overrides?: CallOverrides): Promise<[string]>;

    rejectProperty(
      _propertyAddress: PromiseOrValue<string>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<ContractTransaction>;

    renounceOwnership(
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<ContractTransaction>;

    transferOwnership(
      newOwner: PromiseOrValue<string>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<ContractTransaction>;

    updateEURCToken(
      _newEURCToken: PromiseOrValue<string>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<ContractTransaction>;

    userProperties(
      arg0: PromiseOrValue<string>,
      arg1: PromiseOrValue<BigNumberish>,
      overrides?: CallOverrides
    ): Promise<
      [string, boolean] & { tokenAddress: string; isApproved: boolean }
    >;
  };

  approveProperty(
    _propertyAddress: PromiseOrValue<string>,
    overrides?: Overrides & { from?: PromiseOrValue<string> }
  ): Promise<ContractTransaction>;

  approvedProperties(
    arg0: PromiseOrValue<string>,
    overrides?: CallOverrides
  ): Promise<boolean>;

  createProperty(
    _title: PromiseOrValue<string>,
    _description: PromiseOrValue<string>,
    _location: PromiseOrValue<string>,
    _imageUrl: PromiseOrValue<string>,
    _price: PromiseOrValue<BigNumberish>,
    overrides?: Overrides & { from?: PromiseOrValue<string> }
  ): Promise<ContractTransaction>;

  eurcTokenAddress(overrides?: CallOverrides): Promise<string>;

  getPropertyCreators(overrides?: CallOverrides): Promise<string[]>;

  getPropertyStatus(
    _propertyAddress: PromiseOrValue<string>,
    overrides?: CallOverrides
  ): Promise<boolean>;

  getUserProperties(
    _user: PromiseOrValue<string>,
    overrides?: CallOverrides
  ): Promise<PropertyFactory.PropertyInfoStructOutput[]>;

  owner(overrides?: CallOverrides): Promise<string>;

  rejectProperty(
    _propertyAddress: PromiseOrValue<string>,
    overrides?: Overrides & { from?: PromiseOrValue<string> }
  ): Promise<ContractTransaction>;

  renounceOwnership(
    overrides?: Overrides & { from?: PromiseOrValue<string> }
  ): Promise<ContractTransaction>;

  transferOwnership(
    newOwner: PromiseOrValue<string>,
    overrides?: Overrides & { from?: PromiseOrValue<string> }
  ): Promise<ContractTransaction>;

  updateEURCToken(
    _newEURCToken: PromiseOrValue<string>,
    overrides?: Overrides & { from?: PromiseOrValue<string> }
  ): Promise<ContractTransaction>;

  userProperties(
    arg0: PromiseOrValue<string>,
    arg1: PromiseOrValue<BigNumberish>,
    overrides?: CallOverrides
  ): Promise<[string, boolean] & { tokenAddress: string; isApproved: boolean }>;

  callStatic: {
    approveProperty(
      _propertyAddress: PromiseOrValue<string>,
      overrides?: CallOverrides
    ): Promise<void>;

    approvedProperties(
      arg0: PromiseOrValue<string>,
      overrides?: CallOverrides
    ): Promise<boolean>;

    createProperty(
      _title: PromiseOrValue<string>,
      _description: PromiseOrValue<string>,
      _location: PromiseOrValue<string>,
      _imageUrl: PromiseOrValue<string>,
      _price: PromiseOrValue<BigNumberish>,
      overrides?: CallOverrides
    ): Promise<string>;

    eurcTokenAddress(overrides?: CallOverrides): Promise<string>;

    getPropertyCreators(overrides?: CallOverrides): Promise<string[]>;

    getPropertyStatus(
      _propertyAddress: PromiseOrValue<string>,
      overrides?: CallOverrides
    ): Promise<boolean>;

    getUserProperties(
      _user: PromiseOrValue<string>,
      overrides?: CallOverrides
    ): Promise<PropertyFactory.PropertyInfoStructOutput[]>;

    owner(overrides?: CallOverrides): Promise<string>;

    rejectProperty(
      _propertyAddress: PromiseOrValue<string>,
      overrides?: CallOverrides
    ): Promise<void>;

    renounceOwnership(overrides?: CallOverrides): Promise<void>;

    transferOwnership(
      newOwner: PromiseOrValue<string>,
      overrides?: CallOverrides
    ): Promise<void>;

    updateEURCToken(
      _newEURCToken: PromiseOrValue<string>,
      overrides?: CallOverrides
    ): Promise<void>;

    userProperties(
      arg0: PromiseOrValue<string>,
      arg1: PromiseOrValue<BigNumberish>,
      overrides?: CallOverrides
    ): Promise<
      [string, boolean] & { tokenAddress: string; isApproved: boolean }
    >;
  };

  filters: {
    "EURCTokenUpdated(address)"(
      newAddress?: PromiseOrValue<string> | null
    ): EURCTokenUpdatedEventFilter;
    EURCTokenUpdated(
      newAddress?: PromiseOrValue<string> | null
    ): EURCTokenUpdatedEventFilter;

    "OwnershipTransferred(address,address)"(
      previousOwner?: PromiseOrValue<string> | null,
      newOwner?: PromiseOrValue<string> | null
    ): OwnershipTransferredEventFilter;
    OwnershipTransferred(
      previousOwner?: PromiseOrValue<string> | null,
      newOwner?: PromiseOrValue<string> | null
    ): OwnershipTransferredEventFilter;

    "PropertyApproved(address)"(
      tokenAddress?: PromiseOrValue<string> | null
    ): PropertyApprovedEventFilter;
    PropertyApproved(
      tokenAddress?: PromiseOrValue<string> | null
    ): PropertyApprovedEventFilter;

    "PropertyRejected(address)"(
      tokenAddress?: PromiseOrValue<string> | null
    ): PropertyRejectedEventFilter;
    PropertyRejected(
      tokenAddress?: PromiseOrValue<string> | null
    ): PropertyRejectedEventFilter;

    "PropertySubmitted(address,address)"(
      owner?: PromiseOrValue<string> | null,
      tokenAddress?: PromiseOrValue<string> | null
    ): PropertySubmittedEventFilter;
    PropertySubmitted(
      owner?: PromiseOrValue<string> | null,
      tokenAddress?: PromiseOrValue<string> | null
    ): PropertySubmittedEventFilter;
  };

  estimateGas: {
    approveProperty(
      _propertyAddress: PromiseOrValue<string>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<BigNumber>;

    approvedProperties(
      arg0: PromiseOrValue<string>,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    createProperty(
      _title: PromiseOrValue<string>,
      _description: PromiseOrValue<string>,
      _location: PromiseOrValue<string>,
      _imageUrl: PromiseOrValue<string>,
      _price: PromiseOrValue<BigNumberish>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<BigNumber>;

    eurcTokenAddress(overrides?: CallOverrides): Promise<BigNumber>;

    getPropertyCreators(overrides?: CallOverrides): Promise<BigNumber>;

    getPropertyStatus(
      _propertyAddress: PromiseOrValue<string>,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    getUserProperties(
      _user: PromiseOrValue<string>,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    owner(overrides?: CallOverrides): Promise<BigNumber>;

    rejectProperty(
      _propertyAddress: PromiseOrValue<string>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<BigNumber>;

    renounceOwnership(
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<BigNumber>;

    transferOwnership(
      newOwner: PromiseOrValue<string>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<BigNumber>;

    updateEURCToken(
      _newEURCToken: PromiseOrValue<string>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<BigNumber>;

    userProperties(
      arg0: PromiseOrValue<string>,
      arg1: PromiseOrValue<BigNumberish>,
      overrides?: CallOverrides
    ): Promise<BigNumber>;
  };

  populateTransaction: {
    approveProperty(
      _propertyAddress: PromiseOrValue<string>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<PopulatedTransaction>;

    approvedProperties(
      arg0: PromiseOrValue<string>,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    createProperty(
      _title: PromiseOrValue<string>,
      _description: PromiseOrValue<string>,
      _location: PromiseOrValue<string>,
      _imageUrl: PromiseOrValue<string>,
      _price: PromiseOrValue<BigNumberish>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<PopulatedTransaction>;

    eurcTokenAddress(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    getPropertyCreators(
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    getPropertyStatus(
      _propertyAddress: PromiseOrValue<string>,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    getUserProperties(
      _user: PromiseOrValue<string>,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    owner(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    rejectProperty(
      _propertyAddress: PromiseOrValue<string>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<PopulatedTransaction>;

    renounceOwnership(
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<PopulatedTransaction>;

    transferOwnership(
      newOwner: PromiseOrValue<string>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<PopulatedTransaction>;

    updateEURCToken(
      _newEURCToken: PromiseOrValue<string>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<PopulatedTransaction>;

    userProperties(
      arg0: PromiseOrValue<string>,
      arg1: PromiseOrValue<BigNumberish>,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;
  };
}
