# Pipeline smart contract

## Description
Linear streams from one user to another on the fuel network

## Functions to understand
See ./src/interface.sw for more details on functions and examples of use

### Create Stream

#### Calling
- Call `create_stream` with a recipient (the expected stream receiver), a start time and an end time
- This is a payable function that you need to send the desired asset you would like to stream

#### Effects
- A new stream is created with a stream_id <stream_id>
- Two tokens are generated, an rToken (receiver) and an sToken (sender)
- rToken will have metadata as follows { 'token_type': 'RECEIVER', 'stream_id': <stream_id>} and sent to the receiver
- sToken will have metadata as follows { 'token_type': 'SENDER', 'stream_id': <stream_id>} and sent to the signer of the transaction

### Withdraw
SRC6 function
#### Calling
- call `withdraw` with the reciever of the tokens that you wish to withdraw, the underlying_asset id, and the vault_sub_id
- This is a payable function that you need to send the s or r Token that you would like to redeem

#### Effect with rToken
- any and all vested tokens are withdrawn
- rToken is returned (or burned and reminted) to the tx signer

#### Effect with sToken
- stream is cancelled, all funds are returned to receiver and sender

### Partial withdraw from stream
Custom function

Same as above although it doesn't have to comply with the SRC6 standard so we can do a partial withdrawal
Only valid for rTokens, sTokens will be rejected

#### Calling
- call `partial_withdraw_from_stream` the same way as `withdraw` above, but add the amount parameter specifying how much of the underlying asset to withdraw

#### Effect 
- the number of tokens specified in amount will be withdrawn as long as it is less than the remaining vested tokens
- rToken is returned (or burned and reminted) to the tx signer


### Deposit
SRC6 function

- No need to call this function as with fully collateralized streams it will just revert
### Max Depositable

SRC6 function

- Unused as we don't support deposits as of now
- Will return 0 or None depending on existence


###  Max withdrawable
SRC6 function

#### Calling
- call `max_withdrawable` with the asset id of the underlying asset and the vault sub id

#### Effects
- Read-only function will return the max assets that the sender or receiver can get at this time (rTokens = vested unclaimed tokens) (sTokens = unvested tokens)


### Managed Assets
SRC6 function

#### Calling
- call `managed_assets` with the underlying asset id and the vault sub id

#### Effects
- Read-only function will return the total assets that either set of tokens (rTokens or sTokens) has access to. 
- For now this is the same as max_withdrawable, but when multiple rTokens or sTokens exist and are split among wallets, this will not be the case.