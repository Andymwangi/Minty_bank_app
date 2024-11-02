"use server";

import { Client } from "dwolla-v2";

// Define environment configuration function
const getEnvironment = (): "production" | "sandbox" => {
  const environment = process.env.DWOLLA_ENV as string;

  switch (environment) {
    case "sandbox":
      return "sandbox";
    case "production":
      return "production";
    default:
      throw new Error(
        "Dwolla environment should either be set to `sandbox` or `production`"
      );
  }
};

// Instantiate Dwolla client
const dwollaClient = new Client({
  environment: getEnvironment(),
  key: process.env.DWOLLA_KEY as string,
  secret: process.env.DWOLLA_SECRET as string,
});

// Helper function to validate state
const isValidState = (state: string) => /^[A-Z]{2}$/.test(state);

// Create Dwolla Customer with state validation
export const createDwollaCustomer = async (
  newCustomer: NewDwollaCustomerParams
) => {
  if (!isValidState(newCustomer.state)) {
    throw new Error("Invalid state format. Use a two-letter state abbreviation.");
  }

  try {
    return await dwollaClient
      .post("customers", newCustomer)
      .then((res) => res.headers.get("location"));
  } catch (err: any) {
    if (err.body) {
      console.error("Error details:", err.body._embedded.errors);
    }
    console.error("Creating a Dwolla Customer Failed: ", err);
    throw err; // Optional: rethrow for higher-level handling
  }
};

// Create a Dwolla Funding Source using a Plaid Processor Token
export const createFundingSource = async (
  options: CreateFundingSourceOptions
) => {
  try {
    return await dwollaClient
      .post(`customers/${options.customerId}/funding-sources`, {
        name: options.fundingSourceName,
        plaidToken: options.plaidToken,
      })
      .then((res) => res.headers.get("location"));
  } catch (err: any) {
    if (err.body) {
      console.error("Error details:", err.body._embedded.errors);
    }
    console.error("Creating a Funding Source Failed: ", err);
    throw err;
  }
};

// Create On-Demand Authorization
export const createOnDemandAuthorization = async () => {
  try {
    const onDemandAuthorization = await dwollaClient.post(
      "on-demand-authorizations"
    );
    return onDemandAuthorization.body._links;
  } catch (err: any) {
    if (err.body) {
      console.error("Error details:", err.body._embedded.errors);
    }
    console.error("Creating an On Demand Authorization Failed: ", err);
    throw err;
  }
};

// Create a Transfer
export const createTransfer = async ({
  sourceFundingSourceUrl,
  destinationFundingSourceUrl,
  amount,
}: TransferParams) => {
  try {
    const requestBody = {
      _links: {
        source: { href: sourceFundingSourceUrl },
        destination: { href: destinationFundingSourceUrl },
      },
      amount: { currency: "USD", value: amount },
    };
    return await dwollaClient
      .post("transfers", requestBody)
      .then((res) => res.headers.get("location"));
  } catch (err: any) {
    if (err.body) {
      console.error("Error details:", err.body._embedded.errors);
    }
    console.error("Transfer fund failed: ", err);
    throw err;
  }
};

// Add Funding Source with Authorization Link (if needed)
export const addFundingSource = async ({
  dwollaCustomerId,
  processorToken,
  bankName,
}: AddFundingSourceParams) => {
  try {
    const dwollaAuthLinks = await createOnDemandAuthorization();

    const fundingSourceOptions = {
      customerId: dwollaCustomerId,
      fundingSourceName: bankName,
      plaidToken: processorToken,
      _links:dwollaAuthLinks
    };
    return await createFundingSource(fundingSourceOptions);
  } catch (err: any) {
    if (err.body) {
      console.error("Error details:", err.body._embedded.errors);
    }
    console.error("Adding funding source failed: ", err);
    throw err;
  }
};
