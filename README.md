![Pipeline URL](https://www.pipeline.finance/title_logo.svg)

[Testnet App](pipeline.finance)

## About

Pipeline Finance is a token streaming platform for the fuel blockchain.

Token streams are a form of payment channel where a sender can pay a receiver a certain amount of money over a fixed period of time. Rather than having discrete payments (think paycheck every two weeks) the receiver gets access to their funds continuously.

Streaming can be used to pay for services, for software access, to vest tokens like stock options, or as a form of timelock.

How it works:
Token streams are initiated by the sender who creates a stream.

1. They choose an amount, an asset to send, a receiver, and a range of dates to send from and to.
2. They deposit their tokens into the stream.
3. While the stream is active the receiver can withdraw their vested tokens at any time
4. If the sender at any point wants to stop the stream they can, but the receiver will still have access to any funds vested until that point.

Two additional stream types have been added.

1. Under-collateralized streams

- Users can set up a stream that does not require the full deposit at start time. The sender can continuously top off funds.

2. Un-cancellable streams

- Streams that once created cannot be cancelled by the sender
- Usefull mostly for token vesting not payments.

## Getting Started

### Prerequisites

- **Rust:** Install Rust from the [official website](https://www.rust-lang.org/tools/install).
- **Docker:** Install Docker from the [official website](https://docs.docker.com/get-docker/).
- **Fuel toolchain:** Install this using `fuelup` from the [official website](https://docs.fuel.network/docs/intro/quickstart-contract/).
  - Run nightly version `fuelup default nightly`
  - Ensure that Fuel tooling is up to date run `fuelup update`
- **Cargo make** is used for simplifying workspace tasks [official website](https://sagiegurari.github.io/cargo-make/)
  - `cargo install cargo-make`
- Node.js and Pnpm package manager [official website](https://pnpm.io)
- Fuel Development Wallet

First, run a yarn install:

```bash
yarn install
```

Then, run the development server:

```bash
make dev -j3
```
