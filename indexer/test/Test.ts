import assert from "assert";
import { TestHelpers, TokenStreaming_CreateStream } from "generated";
const { MockDb, TokenStreaming } = TestHelpers;

describe("TokenStreaming contract CreateStream event tests", () => {
  // Create mock db
  const mockDb = MockDb.createMockDb();

  // Creating mock for TokenStreaming contract CreateStream event
  const event = TokenStreaming.CreateStream.mock({
    data: {} /* It mocks event fields with default values, so you only need to provide data */,
  });

  it("TokenStreaming_CreateStream is created correctly", async () => {
    // Processing the event
    const mockDbUpdated = await TokenStreaming.CreateStream.processEvent({
      event,
      mockDb,
    });

    // Getting the actual entity from the mock database
    const actualTokenStreamingCreateStream =
      mockDbUpdated.entities.TokenStreaming_CreateStream.get(
        `${event.transactionId}_${event.receiptIndex}`,
      );

    // Creating the expected entity
    const expectedTokenStreamingCreateStream: TokenStreaming_CreateStream = {
      id: `${event.transactionId}_${event.receiptIndex}`,
    };
    // Asserting that the entity in the mock database is the same as the expected entity
    assert.deepEqual(
      actualTokenStreamingCreateStream,
      expectedTokenStreamingCreateStream,
      "Actual TokenStreamingCreateStream should be the same as the expectedTokenStreamingCreateStream",
    );
  });
});
