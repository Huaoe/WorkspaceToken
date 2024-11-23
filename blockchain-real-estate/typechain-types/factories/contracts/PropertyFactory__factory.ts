/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */
import {
  Contract,
  ContractFactory,
  ContractTransactionResponse,
  Interface,
} from "ethers";
import type {
  Signer,
  AddressLike,
  ContractDeployTransaction,
  ContractRunner,
} from "ethers";
import type { NonPayableOverrides } from "../../common";
import type {
  PropertyFactory,
  PropertyFactoryInterface,
} from "../../contracts/PropertyFactory";

const _abi = [
  {
    inputs: [
      {
        internalType: "address",
        name: "initialOwner",
        type: "address",
      },
      {
        internalType: "address",
        name: "_eurcTokenAddress",
        type: "address",
      },
    ],
    stateMutability: "nonpayable",
    type: "constructor",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "owner",
        type: "address",
      },
    ],
    name: "OwnableInvalidOwner",
    type: "error",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "account",
        type: "address",
      },
    ],
    name: "OwnableUnauthorizedAccount",
    type: "error",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "newAddress",
        type: "address",
      },
    ],
    name: "EURCTokenUpdated",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "previousOwner",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "newOwner",
        type: "address",
      },
    ],
    name: "OwnershipTransferred",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "tokenAddress",
        type: "address",
      },
    ],
    name: "PropertyApproved",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "tokenAddress",
        type: "address",
      },
    ],
    name: "PropertyRejected",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "owner",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "tokenAddress",
        type: "address",
      },
    ],
    name: "PropertySubmitted",
    type: "event",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "_propertyAddress",
        type: "address",
      },
    ],
    name: "approveProperty",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    name: "approvedProperties",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "string",
        name: "_title",
        type: "string",
      },
      {
        internalType: "string",
        name: "_description",
        type: "string",
      },
      {
        internalType: "string",
        name: "_location",
        type: "string",
      },
      {
        internalType: "string",
        name: "_imageUrl",
        type: "string",
      },
      {
        internalType: "uint256",
        name: "_price",
        type: "uint256",
      },
    ],
    name: "createProperty",
    outputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "eurcTokenAddress",
    outputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getPropertyCreators",
    outputs: [
      {
        internalType: "address[]",
        name: "",
        type: "address[]",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "_propertyAddress",
        type: "address",
      },
    ],
    name: "getPropertyStatus",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "_user",
        type: "address",
      },
    ],
    name: "getUserProperties",
    outputs: [
      {
        components: [
          {
            internalType: "address",
            name: "tokenAddress",
            type: "address",
          },
          {
            internalType: "bool",
            name: "isApproved",
            type: "bool",
          },
        ],
        internalType: "struct PropertyFactory.PropertyInfo[]",
        name: "",
        type: "tuple[]",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "owner",
    outputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "_propertyAddress",
        type: "address",
      },
    ],
    name: "rejectProperty",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "renounceOwnership",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "newOwner",
        type: "address",
      },
    ],
    name: "transferOwnership",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "_newEURCToken",
        type: "address",
      },
    ],
    name: "updateEURCToken",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    name: "userProperties",
    outputs: [
      {
        internalType: "address",
        name: "tokenAddress",
        type: "address",
      },
      {
        internalType: "bool",
        name: "isApproved",
        type: "bool",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
] as const;

const _bytecode =
  "0x608060409080825234620001f057818162003c248038038091620000248285620001f5565b833981010312620001f05762000048602062000040836200022f565b92016200022f565b6001600160a01b03828116929091908315620001d857600080546001600160a01b031980821687178355959192919085167f8be0079c531659141344cd1fd0a4f28419497f9722a3daafe3b4186f6b6457e08480a385516001600160401b0391906060810183811182821017620001c4578852602881527f496e697469616c697a696e672050726f7065727479466163746f727920776974602082015267341037bbb732b91d60c11b8882015262000101919062000244565b85519182870191821183831017620001b057506200014d9183918752601381527f4555524320746f6b656e20616464726573733a00000000000000000000000000602082015262000244565b169081156200016c576004541617600455516139499081620002db8239f35b825162461bcd60e51b815260206004820152601a60248201527f496e76616c6964204555524320746f6b656e20616464726573730000000000006044820152606490fd5b634e487b7160e01b81526041600452602490fd5b634e487b7160e01b85526041600452602485fd5b8451631e4fbdf760e01b815260006004820152602490fd5b600080fd5b601f909101601f19168101906001600160401b038211908210176200021957604052565b634e487b7160e01b600052604160045260246000fd5b51906001600160a01b0382168203620001f057565b604051906020928383019363319af33360e01b85526040602485015282519283606486015260005b848110620002c55750505091620002b2608482846000979596888481998501015260018060a01b03166044830152601f80199101168101036064810184520182620001f5565b51906a636f6e736f6c652e6c6f675afa50565b8181018301518682016084015282016200026c56fe604060808152600490813610156200001657600080fd5b600091823560e01c80630604e4561462000a15578063060a3e6114620008ee57806311798bd1146200056757806321499e8b146200014e578063293172be14620004b3578063715018a6146200045557806388cbb358146200031f5780638cdb1c6d14620002f65780638da5cb5b14620002cc578063a1cda61014620001ff578063e2271c9f1462000194578063e848a496146200014e5763f2fde38b14620000be57600080fd5b346200014a5760203660031901126200014a57620000db62001095565b90620000e662001113565b6001600160a01b039182169283156200013457505082546001600160a01b0319811683178455167f8be0079c531659141344cd1fd0a4f28419497f9722a3daafe3b4186f6b6457e08380a380f35b51631e4fbdf760e01b8152908101849052602490fd5b8280fd5b50503462000190576020366003190112620001905760209160ff9082906001600160a01b036200017d62001095565b1681526002855220541690519015158152f35b5080fd5b828434620001fc5781600319360112620001fc57620001b262001095565b6001600160a01b03908116825260016020528282208054919260243592831015620001fc575060ff91620001e691620010fa565b50548351928116835260a01c1615156020820152f35b80fd5b828434620001fc5780600319360112620001fc579080519182906003549182855260208095018093600384527fc2575a0e9e593c00f959f8c92f12db2869c3395a3b0502d05e2516446f71f85b90845b818110620002ae57505050816200026891038262001011565b83519485948186019282875251809352850193925b8281106200028d57505050500390f35b83516001600160a01b0316855286955093810193928101926001016200027d565b82546001600160a01b0316845292880192600192830192016200024f565b5050346200019057816003193601126200019057905490516001600160a01b039091168152602090f35b50346200014a57826003193601126200014a575490516001600160a01b03909116815260209150f35b50503462000190576020806003193601126200014a576200033f62001095565b916200034a62001113565b6001600160a01b039283169262000363841515620011a8565b838552600283526200037c60ff838720541615620011f5565b8492859260038054945b858110620003c3575b88886200039c8962001242565b7f7398de549412614f936085bf40b8de774cc79aa59eca1d141f732afa1d06ed5d8280a280f35b84620003cf82620010ac565b905490841b1c168952866001808652848b20908b918054925b83811062000411575b505050506200040b57620004059062001182565b62000386565b6200038f565b90919293508b89620004248385620010fa565b505416146200044357620004389062001182565b908a939291620003e8565b505091975050958638808080620003f1565b8334620001fc5780600319360112620001fc576200047262001113565b80546001600160a01b03198116825581906001600160a01b03167f8be0079c531659141344cd1fd0a4f28419497f9722a3daafe3b4186f6b6457e08280a380f35b50346200014a5760203660031901126200014a57620004d162001095565b620004db62001113565b6001600160a01b031691821562000524575080546001600160a01b031916821790557fbd646d14214de76e6fa53d2f8cbc7e6d4d073b6ad202e5e127a6a91bf9166c698280a280f35b906020606492519162461bcd60e51b8352820152601a60248201527f496e76616c6964204555524320746f6b656e20616464726573730000000000006044820152fd5b50503462000190576020806003193601126200014a576200058762001095565b916200059262001113565b620005d48151620005a38162000fde565b601b81527f417070726f76696e672070726f70657274792e2043616c6c65723a00000000008482015233906200134b565b805191620005e28362000fde565b6200060c8460119485815270283937b832b93a3c9030b2323932b9b99d60791b848201526200134b565b60018060a01b03926200064a848754168451620006298162000fde565b600f81526e21b7b73a3930b1ba1037bbb732b91d60891b858201526200134b565b836003956200069087548651620006618162000fde565b601c81527f4e756d626572206f662070726f70657274792063726561746f72733a0000000087820152620012a3565b16936200069f851515620011a8565b84875260028352620006b860ff858920541615620011f5565b8691875b8754811015620007f05782620006d282620010ac565b9054908a1b1c166200070d818851620006eb8162000fde565b8581527021b432b1b5b4b7339031b932b0ba37b91d60791b898201526200134b565b8952836001808752878b208b808a62000796620007bd8c620007ae8754855195620007388762000fde565b600b87526a43726561746f722068617360a81b848801528051906200075d8262000fde565b600a82526970726f7065727469657360b01b8583015251958694850197635970e08960e01b895260606024870152608486019062001140565b91604485015260231984830301606485015262001140565b03601f19810183528262001011565b51906a636f6e736f6c652e6c6f675afa508b825b6200083c575b505050620007f057620007ea9062001182565b620006bc565b505050600292939450620008049062001242565b838552528220805460ff191660011790557f471a6ffe019f8c983f020cef87372b7df53511fed02de5dc861b7fb8cc19d17f8280a280f35b9091928254821015620008e757506200088f866200085b8385620010fa565b5054168a516200086b8162000fde565b601281527121b432b1b5b4b73390383937b832b93a3c9d60711b8b8201526200134b565b89866200089d8385620010fa565b50541614620008bc57620008b2839162001182565b87939291620007d1565b9195508591620008cc91620010fa565b50805460ff60a01b1916600160a01b179055388080620007d7565b92620007d7565b5090346200014a576020918260031936011262000a11576001600160a01b0392836200091962001095565b1685526001948582528381209384549367ffffffffffffffff8511620009fe57509286928685519262000952838260051b018562001011565b8084528284018098865283862086915b838310620009b4575050505085519582870193838852518094528087019794915b848310620009915787890388f35b8551805182168a5284015115158985015297810197948301949186019162000983565b90888087819d9b95948860ff8f9a9f9d9b9c9d5191620009d48362000fde565b8754908116835260a01c161515838201528152019201920192509997999893989695949662000962565b634e487b7160e01b835260419052602482fd5b8380fd5b508234620001fc5760a0366003190112620001fc5767ffffffffffffffff82358181116200014a5762000a4c903690850162001034565b936024803583811162000fda5762000a68903690870162001034565b604490813585811162000fd65762000a84903690890162001034565b91606492833587811162000fd2578a9062000aa39036908c0162001034565b9460843593885162000ab58162000fde565b601d815260209d8e82017f4372656174696e672070726f70657274792077697468207469746c653a000000905262000aed91620012ff565b8851868e62000afc8362000fde565b600c835282016b2232b9b1b934b83a34b7b71d60a11b905262000b1f91620012ff565b8851848e62000b2e8362000fde565b600983528201682637b1b0ba34b7b71d60b91b905262000b4e91620012ff565b8851878e62000b5d8362000fde565b600a835282016924b6b0b3b2902aa9261d60b11b905262000b7e91620012ff565b8851858e62000b8d8362000fde565b60068352820165283934b1b29d60d11b905262000baa91620012a3565b885162000bb78162000fde565b600781528d81016629b2b73232b91d60c91b90523362000bd7916200134b565b82511562000f9b5785511562000f5c5783511562000f1d5786511562000ede57841562000e9f57505060018060a01b0394858b54169288519561257493848801948886108d87111762000e8b578f9362000c658a9998979562000c829562000c5760c0999662000c73968e620013a0903960e08a5260e08a019062001140565b918883039089015262001140565b858103868f01529062001140565b90838203606085015262001140565b9360808201523360a08201520152039086f0801562000e8157835190821694606082019081118282101762000e6f5762000cf39186918652602281527f437265617465642070726f706572747920746f6b656e206174206164647265738a82015261399d60f11b868201526200134b565b33855260019182885283862092845162000d0d8162000fde565b868152898101888152855468010000000000000000968782101562000e5d579062000d3d918582018155620010fa565b92909262000e4c5751825491516001600160a81b03199092169086161790151560a01b60ff60a01b1617905560038054979889989195919391895b85811062000e14575b5088999a1562000dbe575b5050505050505051927fc52096134fa3ad0a31f783ae63444e22ff5a177dd5392e4cba144ea83605a984339180a38152f35b90919293809596979850101562000e035750508162000de5918796959493018455620010ac565b81939154911b9133831b921b19161790558580808080808062000d8c565b634e487b7160e01b89526041905287fd5b8662000e2082620010ac565b9054908a1b1c16331462000e3f5762000e399062001182565b62000d78565b5092995089928862000d81565b634e487b7160e01b8a52898b52848afd5b634e487b7160e01b8b5260418c52858bfd5b634e487b7160e01b8752604188528387fd5b83513d87823e3d90fd5b5050634e487b7160e01b8c5260418d52888cfd5b7f5072696365206d7573742062652067726561746572207468616e2030000000008c91601c8f8b908d519562461bcd60e51b8752860152840152820152fd5b7f496d6167652055524c2063616e6e6f7420626520656d707479000000000000008c9160198f8b908d519562461bcd60e51b8752860152840152820152fd5b7f4c6f636174696f6e2063616e6e6f7420626520656d70747900000000000000008c9160188f8b908d519562461bcd60e51b8752860152840152820152fd5b7f4465736372697074696f6e2063616e6e6f7420626520656d70747900000000008c91601b8f8b908d519562461bcd60e51b8752860152840152820152fd5b745469746c652063616e6e6f7420626520656d70747960581b8c9160158f8b908d519562461bcd60e51b8752860152840152820152fd5b8880fd5b8680fd5b8480fd5b6040810190811067ffffffffffffffff82111762000ffb57604052565b634e487b7160e01b600052604160045260246000fd5b90601f8019910116810190811067ffffffffffffffff82111762000ffb57604052565b81601f82011215620010905780359067ffffffffffffffff821162000ffb57604051926200106d601f8401601f19166020018562001011565b828452602083830101116200109057816000926020809301838601378301015290565b600080fd5b600435906001600160a01b03821682036200109057565b600354811015620010e45760036000527fc2575a0e9e593c00f959f8c92f12db2869c3395a3b0502d05e2516446f71f85b0190600090565b634e487b7160e01b600052603260045260246000fd5b8054821015620010e45760005260206000200190600090565b6000546001600160a01b031633036200112857565b60405163118cdaa760e01b8152336004820152602490fd5b919082519283825260005b8481106200116d575050826000602080949584010152601f8019910116010190565b6020818301810151848301820152016200114b565b6000198114620011925760010190565b634e487b7160e01b600052601160045260246000fd5b15620011b057565b60405162461bcd60e51b815260206004820152601860248201527f496e76616c69642070726f7065727479206164647265737300000000000000006044820152606490fd5b15620011fd57565b60405162461bcd60e51b815260206004820152601960248201527f50726f706572747920616c726561647920617070726f766564000000000000006044820152606490fd5b156200124a57565b60405162461bcd60e51b815260206004820152602b60248201527f50726f7065727479206e6f7420666f756e6420696e20616e792075736572277360448201526a2070726f7065727469657360a81b6064820152608490fd5b600091908291620012ec6040518092620012d76020830195632d839cb360e21b875260406024850152606484019062001140565b90604483015203601f19810183528262001011565b51906a636f6e736f6c652e6c6f675afa50565b60009190620007ae620012ec8493604051928391620013386020840196634b5c427760e01b885260406024860152606485019062001140565b8381036023190160448501529062001140565b600091908291620012ec60405180926200137f602083019563319af33360e01b875260406024850152606484019062001140565b6001600160a01b0391909116604483015203601f1981018352826200101156fe6080806040523462000fed576200257480380380916200002082856200102a565b8339810160e08282031262000fed5781516001600160401b03811162000fed57816200004e91840162001073565b60208301519092906001600160401b03811162000fed57826200007391830162001073565b60408201519093906001600160401b03811162000fed57836200009891840162001073565b606083015190936001600160401b03821162000fed57620000bb91840162001073565b93608083015194620000de60c0620000d660a08701620010ce565b9501620010ce565b604051620000ec8162000ff2565b600e81526d283937b832b93a3c902a37b5b2b760911b602082015260405190620001168262000ff2565b6004825263050524f560e41b60208301528051906001600160401b038211620008ec5760035490600182811c9216801562000fe2575b6020831014620008cb5781601f84931162000f6d575b50602090601f831160011462000ee25760009262000ed6575b50508160011b916000199060031b1c1916176003555b8051906001600160401b038211620008ec5760045490600182811c9216801562000ecb575b6020831014620008cb5781601f84931162000e56575b50602090601f831160011462000dcb5760009262000dbf575b50508160011b916000199060031b1c1916176004555b6001600160a01b0385161562000da657600580546001600160a01b038781166001600160a01b031983168117909355167f8be0079c531659141344cd1fd0a4f28419497f9722a3daafe3b4186f6b6457e0600080a3600080620002c7620002e960405162000269816200100e565b602281527f4372656174696e672050726f7065727479546f6b656e2077697468207469746c602082015261329d60f11b6040820152620002da604051938492634b5c427760e01b6020850152604060248501526064840190620010e3565b8281036023190160448401528a620010e3565b03601f1981018352826200102a565b6020815191016a636f6e736f6c652e6c6f675afa506000806040516200030f8162000ff2565b6006815265283934b1b29d60d11b602082015260405162000364816200034f6020820194632d839cb360e21b8652604060248401526064830190620010e3565b8d604483015203601f1981018352826200102a565b51906a636f6e736f6c652e6c6f675afa50620003a985604051620003888162000ff2565b600e81526d24b734ba34b0b61037bbb732b91d60911b60208201526200110a565b620003da81604051620003bc8162000ff2565b600b81526a22aaa921903a37b5b2b71d60a91b60208201526200110a565b8351801515908162000d99575b501562000d54578251801515908162000d47575b501562000d02578551801515908162000cf4575b501562000caf578151801515908162000ca2575b501562000c5d57861562000c18576001600160a01b0381161562000bd357600c80546001600160a01b0319166001600160a01b0392909216919091179055604051916001600160401b0360c0840190811190841117620008ec5760c0830160405283835260208301528460408301526060820152846080820152600160a0820152815160018060401b038111620008ec57600654600181811c9116801562000bc8575b6020821014620008cb57601f811162000b73575b50806020601f821160011462000afa5760009162000aee575b508160011b916000199060031b1c1916176006555b60208101518051906001600160401b038211620008ec5760075490600182811c9216801562000ae3575b6020831014620008cb5781601f84931162000a82575b50602090601f831160011462000a0457600092620009f8575b50508160011b916000199060031b1c1916176007555b60408101518051906001600160401b038211620008ec5760085490600182811c92168015620009ed575b6020831014620008cb5781601f8493116200098c575b50602090601f83116001146200090e5760009262000902575b50508160011b916000199060031b1c1916176008555b60608101518051906001600160401b038211620008ec57600954600181811c91168015620008e1575b6020821014620008cb57601f811162000872575b50602090601f8311600114620007f45760a093929160009183620007e8575b50508160011b916000199060031b1c1916176009555b6080810151600a550151151560ff8019600b5416911617600b5560025491683635c9adc5dea0000092838101809111620007d2576002556001600160a01b038116600081815260208181526040808320805488019055519586527f6a3469cad0792fe1fea0bc1ddba3dfba95b7e9bc169a5d391d283dbe2ea64e95966200071a966200072994919391927fddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef91a3604051948594606086526060860190620010e3565b908482036020860152620010e3565b60408301959095526001600160a01b0316930390a26000806040516200074f816200100e565b602281527f50726f7065727479546f6b656e2063726561746564207375636365737366756c6020820152616c7960f01b6040820152604051620007b181620002da602082019463104c13eb60e21b8652602060248401526044830190620010e3565b51906a636f6e736f6c652e6c6f675afa506040516113829081620011728239f35b634e487b7160e01b600052601160045260246000fd5b01519050388062000642565b6009600090815260008051602062002534833981519152929190601f198516905b81811062000859575091600193918560a0979694106200083f575b505050811b0160095562000658565b015160001960f88460031b161c1916905538808062000830565b9293602060018192878601518155019501930162000815565b600960005260008051602062002534833981519152601f840160051c81019160208510620008c0575b601f0160051c01905b818110620008b3575062000623565b60008155600101620008a4565b90915081906200089b565b634e487b7160e01b600052602260045260246000fd5b90607f16906200060f565b634e487b7160e01b600052604160045260246000fd5b015190503880620005d0565b6008600090815293506000805160206200251483398151915291905b601f198416851062000970576001945083601f1981161062000956575b505050811b01600855620005e6565b015160001960f88460031b161c1916905538808062000947565b818101518355602094850194600190930192909101906200092a565b600860005290915060008051602062002514833981519152601f840160051c810160208510620009e5575b90849392915b601f830160051c82018110620009d5575050620005b7565b60008155859450600101620009bd565b5080620009b7565b91607f1691620005a1565b01519050388062000561565b600760009081529350600080516020620024f483398151915291905b601f198416851062000a66576001945083601f1981161062000a4c575b505050811b0160075562000577565b015160001960f88460031b161c1916905538808062000a3d565b8181015183556020948501946001909301929091019062000a20565b6007600052909150600080516020620024f4833981519152601f840160051c81016020851062000adb575b90849392915b601f830160051c8201811062000acb57505062000548565b6000815585945060010162000ab3565b508062000aad565b91607f169162000532565b905083015138620004f3565b60066000908152925060008051602062002554833981519152905b601f198316841062000b5a576001935082601f1981161062000b40575b5050811b0160065562000508565b85015160001960f88460031b161c19169055388062000b32565b8581015182556020938401936001909201910162000b15565b600660005260008051602062002554833981519152601f830160051c81016020841062000bc0575b601f830160051c8201811062000bb3575050620004da565b6000815560010162000b9b565b508062000b9b565b90607f1690620004c6565b60405162461bcd60e51b815260206004820152601a60248201527f496e76616c6964204555524320746f6b656e20616464726573730000000000006044820152606490fd5b60405162461bcd60e51b815260206004820152601c60248201527f5072696365206d7573742062652067726561746572207468616e2030000000006044820152606490fd5b60405162461bcd60e51b815260206004820152601860248201527f496e76616c696420696d6167652055524c206c656e67746800000000000000006044820152606490fd5b6064915011153862000423565b60405162461bcd60e51b815260206004820152601760248201527f496e76616c6964206c6f636174696f6e206c656e6774680000000000000000006044820152606490fd5b61010091501115386200040f565b60405162461bcd60e51b815260206004820152601a60248201527f496e76616c6964206465736372697074696f6e206c656e6774680000000000006044820152606490fd5b60329150111538620003fb565b60405162461bcd60e51b815260206004820152601460248201527f496e76616c6964207469746c65206c656e6774680000000000000000000000006044820152606490fd5b60149150111538620003e7565b604051631e4fbdf760e01b815260006004820152602490fd5b015190503880620001e5565b600460009081527f8a35acfbc15ff81a39ae7d344fd709f28e8600b4aa8c65c6b64bfe7fe36bd19b9350601f198516905b81811062000e3d575090846001959493921062000e23575b505050811b01600455620001fb565b015160001960f88460031b161c1916905538808062000e14565b9293602060018192878601518155019501930162000dfc565b60046000529091507f8a35acfbc15ff81a39ae7d344fd709f28e8600b4aa8c65c6b64bfe7fe36bd19b601f840160051c8101916020851062000ec0575b90601f859493920160051c01905b81811062000eb05750620001cc565b6000815584935060010162000ea1565b909150819062000e93565b91607f1691620001b6565b0151905038806200017b565b600360009081527fc2575a0e9e593c00f959f8c92f12db2869c3395a3b0502d05e2516446f71f85b9350601f198516905b81811062000f54575090846001959493921062000f3a575b505050811b0160035562000191565b015160001960f88460031b161c1916905538808062000f2b565b9293602060018192878601518155019501930162000f13565b60036000529091507fc2575a0e9e593c00f959f8c92f12db2869c3395a3b0502d05e2516446f71f85b601f840160051c8101916020851062000fd7575b90601f859493920160051c01905b81811062000fc7575062000162565b6000815584935060010162000fb8565b909150819062000faa565b91607f16916200014c565b600080fd5b604081019081106001600160401b03821117620008ec57604052565b606081019081106001600160401b03821117620008ec57604052565b601f909101601f19168101906001600160401b03821190821017620008ec57604052565b60005b838110620010625750506000910152565b818101518382015260200162001051565b81601f8201121562000fed5780516001600160401b038111620008ec5760405192620010aa601f8301601f1916602001856200102a565b8184526020828401011162000fed57620010cb91602080850191016200104e565b90565b51906001600160a01b038216820362000fed57565b90602091620010fe815180928185528580860191016200104e565b601f01601f1916010190565b6000919082916200115e60405180926200113e602083019563319af33360e01b8752604060248501526064840190620010e3565b6001600160a01b0391909116604483015203601f1981018352826200102a565b51906a636f6e736f6c652e6c6f675afa5056fe6040608081526004908136101561001557600080fd5b600091823560e01c9081627dc37214610d1b57816306fdde0314610c26578163095ea7b314610b7c57816318160ddd14610b5d57816323b872dd14610a69578163313ce56714610a4d5781636617773a14610a245781636c11bcd31461086b57816370a0823114610828578163715018a6146107cb5781637b4e2be7146107af5781637b97008d146104aa5781638d6cc56d1461043b5781638da5cb5b14610412578163902d55a5146103ee57816395d89b41146102d7578163a1bb6170146102a0578163a9059cbb1461026f578163d81bc2711461021c578163dd62ed3e146101d3578163f2fde38b1461013f575063f3b0f3b91461011457600080fd5b3461013b578160031936011261013b57600c5490516001600160a01b039091168152602090f35b5080fd5b9050346101cf5760203660031901126101cf5761015a611141565b90610163611172565b6001600160a01b039182169283156101b9575050600554826bffffffffffffffffffffffff60a01b821617600555167f8be0079c531659141344cd1fd0a4f28419497f9722a3daafe3b4186f6b6457e08380a380f35b51631e4fbdf760e01b8152908101849052602490fd5b8280fd5b50503461013b578060031936011261013b57806020926101f1611141565b6101f961115c565b6001600160a01b0391821683526001865283832091168252845220549051908152f35b82843461026c578060031936011261026c5750600a5461026860ff600b5416610243610d9f565b9261024c610e8a565b94610255610f3e565b61025d610ff2565b9151968796876110e6565b0390f35b80fd5b50503461013b578060031936011261013b5760209061029961028f611141565b602435903361119e565b5160018152f35b83903461013b57602036600319011261013b573580151580910361013b576102c6611172565b60ff8019600b5416911617600b5580f35b82843461026c578060031936011261026c5781519181845492600184811c918186169586156103e4575b60209687851081146103d1579087899a92868b999a9b5291826000146103a757505060011461034c575b85886102688961033d848a0385610d67565b519282849384528301906110a6565b815286935091907f8a35acfbc15ff81a39ae7d344fd709f28e8600b4aa8c65c6b64bfe7fe36bd19b5b82841061038f575050508201018161033d6102688861032b565b8054848a018601528895508794909301928101610375565b60ff19168882015294151560051b8701909401945085935061033d9250610268915089905061032b565b634e487b7160e01b835260228a52602483fd5b92607f1692610301565b50503461013b578160031936011261013b5760209051683635c9adc5dea000008152f35b50503461013b578160031936011261013b5760055490516001600160a01b039091168152602090f35b9050346101cf5760203660031901126101cf57803591610459611172565b8215610467575050600a5580f35b906020606492519162461bcd60e51b8352820152601c60248201527f5072696365206d7573742062652067726561746572207468616e2030000000006044820152fd5b9050346101cf57602091826003193601126107ab5781359160ff600b541615610771576104d883151561127c565b6005546001600160a01b0390811660008181526020819052604090205491959092909185116107305764e8d4a51000610513600a54876112c8565b049286600c5416918551636eb1769f60e11b815233828201523060248201528481604481875afa9081156106b2579086918b916106ff575b50106106bc5785516370a0823160e01b815233828201528481602481875afa9081156106b2579086918b9161067d575b501061063a5790606484928a885195869485936323b872dd60e01b8552339085015260248401528860448401525af1908115610630579480966105ea6105f5937f8fafebcaf9d154343dad25669bfa277f4fbacd7ac6b0c4fed522580e040a0f33988b91610603575b50611309565b33906005541661119e565b82519485528401523392a280f35b6106239150863d8811610629575b61061b8183610d67565b8101906112f1565b386105e4565b503d610611565b84513d89823e3d90fd5b855162461bcd60e51b8152908101849052601960248201527f496e73756666696369656e7420455552432062616c616e6365000000000000006044820152606490fd5b809250868092503d83116106ab575b6106968183610d67565b810103126106a7578590513861057b565b8980fd5b503d61068c565b87513d8c823e3d90fd5b855162461bcd60e51b8152908101849052601b60248201527f496e73756666696369656e74204555524320616c6c6f77616e636500000000006044820152606490fd5b809250868092503d8311610729575b6107188183610d67565b810103126106a7578590513861054b565b503d61070e565b60649184519162461bcd60e51b8352820152601b60248201527f4e6f7420656e6f75676820746f6b656e7320617661696c61626c6500000000006044820152fd5b83606492519162461bcd60e51b8352820152601660248201527550726f7065727479206973206e6f742061637469766560501b6044820152fd5b8380fd5b50503461013b578160031936011261013b576020905160068152f35b833461026c578060031936011261026c576107e4611172565b600580546001600160a01b0319811690915581906001600160a01b03167f8be0079c531659141344cd1fd0a4f28419497f9722a3daafe3b4186f6b6457e08280a380f35b50503461013b57602036600319011261013b57602090610864610849611141565b6001600160a01b031660009081526020819052604090205490565b9051908152f35b83833461013b57602090816003193601126101cf5783359161088e83151561127c565b3384528381528282852054106109e25764e8d4a510006108b0600a54856112c8565b049033156109cb5733855284815282852054958487106109a0578190858798338952888452038588205585600254036002558685518781527fddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef843392a3600c54855163a9059cbb60e01b81523392810192909252602482018590529096879160449183916001600160a01b03165af1948515610996577f2dcf9433d75db0d8b1c172641f85e319ffe4ad22e108a95d1847ceb906e5195d94956105f59188916109795750611309565b6109909150833d85116106295761061b8183610d67565b886105e4565b83513d88823e3d90fd5b835163391434e360e21b81523391810191825260208201889052604082018690529081906060010390fd5b8251634b637e8f60e11b8152808701869052602490fd5b8490606492519162461bcd60e51b8352820152601a60248201527f496e73756666696369656e7420746f6b656e2062616c616e63650000000000006044820152fd5b50503461013b578160031936011261013b57600c5490516001600160a01b039091168152602090f35b50503461013b578160031936011261013b576020905160128152f35b9050823461026c57606036600319011261026c57610a85611141565b610a8d61115c565b916044359360018060a01b038316808352600160205286832033845260205286832054916000198303610ac9575b60208861029989898961119e565b868310610b31578115610b1a573315610b035750825260016020908152868320338452815291869020908590039055829061029987610abb565b8751634a1406b160e11b8152908101849052602490fd5b875163e602df0560e01b8152908101849052602490fd5b8751637dc7a0d960e11b8152339181019182526020820193909352604081018790528291506060010390fd5b50503461013b578160031936011261013b576020906002549051908152f35b9050346101cf57816003193601126101cf57610b96611141565b602435903315610c0f576001600160a01b0316918215610bf857508083602095338152600187528181208582528752205582519081527f8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b925843392a35160018152f35b8351634a1406b160e11b8152908101859052602490fd5b835163e602df0560e01b8152808401869052602490fd5b82843461026c578060031936011261026c578151918160035492600184811c91818616958615610d11575b60209687851081146103d1578899509688969785829a529182600014610cea575050600114610c8e575b505050610268929161033d910385610d67565b9190869350600383527fc2575a0e9e593c00f959f8c92f12db2869c3395a3b0502d05e2516446f71f85b5b828410610cd2575050508201018161033d610268610c7b565b8054848a018601528895508794909301928101610cb9565b60ff19168782015293151560051b8601909301935084925061033d91506102689050610c7b565b92607f1692610c51565b82843461026c578060031936011261026c5750610d36610d9f565b610268610d41610e8a565b92610d4a610f3e565b610d52610ff2565b600a549160ff600b54169351968796876110e6565b90601f8019910116810190811067ffffffffffffffff821117610d8957604052565b634e487b7160e01b600052604160045260246000fd5b60405190600060065490600182811c90808416938415610e80575b6020948584108114610e6c5783885287949392918115610e4c5750600114610ded575b5050610deb92500383610d67565b565b9093915060066000527ff652222313e28459528d920b65115c16c04f3efc82aaedc97be59f3f377c0d3f936000915b818310610e34575050610deb93508201013880610ddd565b85548884018501529485019487945091830191610e1c565b915050610deb94925060ff191682840152151560051b8201013880610ddd565b634e487b7160e01b85526022600452602485fd5b91607f1691610dba565b60405190600060075490600182811c90808416938415610f34575b6020948584108114610e6c5783885287949392918115610e4c5750600114610ed5575050610deb92500383610d67565b9093915060076000527fa66cc928b5edb82af9bd49922954155ab7b0942694bea4ce44661d9a8736c688936000915b818310610f1c575050610deb93508201013880610ddd565b85548884018501529485019487945091830191610f04565b91607f1691610ea5565b60405190600060085490600182811c90808416938415610fe8575b6020948584108114610e6c5783885287949392918115610e4c5750600114610f89575050610deb92500383610d67565b9093915060086000527ff3f7a9fe364faab93b216da50a3214154f22a0a2b415b23a84c8169e8b636ee3936000915b818310610fd0575050610deb93508201013880610ddd565b85548884018501529485019487945091830191610fb8565b91607f1691610f59565b60405190600060095490600182811c9080841693841561109c575b6020948584108114610e6c5783885287949392918115610e4c575060011461103d575050610deb92500383610d67565b9093915060096000527f6e1540171b6c0c960b71a7020d9f60077f6af931a8bbf590da0223dacf75c7af936000915b818310611084575050610deb93508201013880610ddd565b8554888401850152948501948794509183019161106c565b91607f169161100d565b919082519283825260005b8481106110d2575050826000602080949584010152601f8019910116010190565b6020818301810151848301820152016110b1565b94969592611126906111186111349461110a60a0989560c08b5260c08b01906110a6565b9089820360208b01526110a6565b9087820360408901526110a6565b9085820360608701526110a6565b9460808401521515910152565b600435906001600160a01b038216820361115757565b600080fd5b602435906001600160a01b038216820361115757565b6005546001600160a01b0316330361118657565b60405163118cdaa760e01b8152336004820152602490fd5b916001600160a01b03808416928315611263571692831561124a5760009083825281602052604082205490838210611218575091604082827fddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef958760209652828652038282205586815220818154019055604051908152a3565b60405163391434e360e21b81526001600160a01b03919091166004820152602481019190915260448101839052606490fd5b60405163ec442f0560e01b815260006004820152602490fd5b604051634b637e8f60e11b815260006004820152602490fd5b1561128357565b60405162461bcd60e51b815260206004820152601d60248201527f416d6f756e74206d7573742062652067726561746572207468616e20300000006044820152606490fd5b818102929181159184041417156112db57565b634e487b7160e01b600052601160045260246000fd5b90816020910312611157575180151581036111575790565b1561131057565b60405162461bcd60e51b815260206004820152601460248201527311555490c81d1c985b9cd9995c8819985a5b195960621b6044820152606490fdfea2646970667358221220088a8453be0122928f2810f921d7a82a3dd5185336fb75c815b324d991c513c764736f6c63430008140033a66cc928b5edb82af9bd49922954155ab7b0942694bea4ce44661d9a8736c688f3f7a9fe364faab93b216da50a3214154f22a0a2b415b23a84c8169e8b636ee36e1540171b6c0c960b71a7020d9f60077f6af931a8bbf590da0223dacf75c7aff652222313e28459528d920b65115c16c04f3efc82aaedc97be59f3f377c0d3fa264697066735822122076794566138091550568c0c45d8e043292f44d52c09a3ec599285fd8ec26b52364736f6c63430008140033";

type PropertyFactoryConstructorParams =
  | [signer?: Signer]
  | ConstructorParameters<typeof ContractFactory>;

const isSuperArgs = (
  xs: PropertyFactoryConstructorParams
): xs is ConstructorParameters<typeof ContractFactory> => xs.length > 1;

export class PropertyFactory__factory extends ContractFactory {
  constructor(...args: PropertyFactoryConstructorParams) {
    if (isSuperArgs(args)) {
      super(...args);
    } else {
      super(_abi, _bytecode, args[0]);
    }
  }

  override getDeployTransaction(
    initialOwner: AddressLike,
    _eurcTokenAddress: AddressLike,
    overrides?: NonPayableOverrides & { from?: string }
  ): Promise<ContractDeployTransaction> {
    return super.getDeployTransaction(
      initialOwner,
      _eurcTokenAddress,
      overrides || {}
    );
  }
  override deploy(
    initialOwner: AddressLike,
    _eurcTokenAddress: AddressLike,
    overrides?: NonPayableOverrides & { from?: string }
  ) {
    return super.deploy(
      initialOwner,
      _eurcTokenAddress,
      overrides || {}
    ) as Promise<
      PropertyFactory & {
        deploymentTransaction(): ContractTransactionResponse;
      }
    >;
  }
  override connect(runner: ContractRunner | null): PropertyFactory__factory {
    return super.connect(runner) as PropertyFactory__factory;
  }

  static readonly bytecode = _bytecode;
  static readonly abi = _abi;
  static createInterface(): PropertyFactoryInterface {
    return new Interface(_abi) as PropertyFactoryInterface;
  }
  static connect(
    address: string,
    runner?: ContractRunner | null
  ): PropertyFactory {
    return new Contract(address, _abi, runner) as unknown as PropertyFactory;
  }
}
