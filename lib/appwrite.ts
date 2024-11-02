"use server";

import { Client, Account, Databases, Users } from "node-appwrite";
import { cookies } from "next/headers";

export async function createSessionClient() {
  const client = new Client()
    .setEndpoint('https://cloud.appwrite.io/v1')
    .setProject('6719e0ec00141cbff1f8');

  const session = cookies().get("appwrite-session");

  if (!session || !session.value) {
    throw new Error("No session");
  }

  client.setSession(session.value);

  return {
    get account() {
      return new Account(client);
    },
  };
}

export async function createAdminClient() {
  const client = new Client()
    .setEndpoint('https://cloud.appwrite.io/v1')
    .setProject('6719e0ec00141cbff1f8')
    .setKey('standard_082485f1f550cea8e434bef03d5f37d4d15eb9912ca5b58459fd1042ed35d71e22d8df8e136e626523486869421aab1b4dc68a6add6d61fbd2c34ba4872bdb293f7e598986c4672481bfebf84e28763737dc3dd5ff04063fc3d320e2a28e45225835d396658287bd1544e1e48c0bde7e7d951b36dc91bd2f06087f6b064f2144');

  return {
    get account() {
      return new Account(client);
    },
    get database() {
      return new Databases(client);
    },
    get user() {
      return new Users(client);
    }
  };
}

