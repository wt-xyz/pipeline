## Implementation Guide

### Overview

#### Stream creation for airdrops

For an airdrop stream, you likely want an uncancellable fully-collaterialized stream

```rust
use token_streaming::main::Pipeline;

let contract = abi(Pipeline, CONTRACT_ID);
// Define stream parameters
let sender_share_recipient = Identity::Address(Address::from(0x1234...));
let receiver_share_recipient = Identity::Address(Address::from(0x5678...));
let start_time = timestamp();
let stop_time = timestamp() + 2000000;
let stream_size = 1000000;
let configuration = StreamConfiguration {
    is_cancellable: false,
    is_undercollateralized: false,
};
let airdrop_amount = 1000000;

    // Create the stream
let stream_id = contract.create_stream {
    gas: 5000,
    asset_id: msg_asset_id(),
    coins: airdrop_amount,
}
(
    sender_share_recipient,
    receiver_share_recipient,
    start_time,
    stop_time,
    stream_size,
    configuration
);
```

#### Stream claim Tyescript

```typescript
const tokenContract = TokenStreamingAbi__factory.connect(
  contractId,
  wallet.wallet,
);

const withdraw_result = await tokenContract?.functions
  .withdraw(
    recipientIdentityInput,
    { bits: underlyingAsset },
    // This could be any value, used to comply with vault standard
    "0x0000000000000000000000000000000000000000000000000000000000000000",
  )
  .callParams({ forward: [1, shareToken] })
  .txParams({ variableOutputs: 2 })
  .call();
```
