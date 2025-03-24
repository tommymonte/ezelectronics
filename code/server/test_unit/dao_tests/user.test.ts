import {
  describe,
  test,
  expect,
  beforeAll,
  afterAll,
  jest,
} from "@jest/globals";

import UserController from "../../src/controllers/userController";
import UserDAO from "../../src/dao/userDAO";
import { UserAlreadyExistsError } from "../../src/errors/userError";
import crypto from "crypto";
import db from "../../src/db/db";
import { Database } from "sqlite3";

jest.mock("crypto");
jest.mock("../../src/db/db.ts");

//Example of unit test for the createUser method
//It mocks the database run method to simulate a successful insertion and the crypto randomBytes and scrypt methods to simulate the hashing of the password
//It then calls the createUser method and expects it to resolve true

test("It should resolve false", async () => {
  const userDAO = new UserDAO();
  const mockDBRun = jest
    .spyOn(db, "run")
    .mockImplementation((sql, params, callback) => {
      callback(new Error("UNIQUE constraint failed: users.username"));
      return {} as Database;
    });
  const mockRandomBytes = jest
    .spyOn(crypto, "randomBytes")
    .mockImplementation((size) => {
      return Buffer.from("salt");
    });
  const mockScrypt = jest
    .spyOn(crypto, "scrypt")
    .mockImplementation(async (password, salt, keylen) => {
      return Buffer.from("hashedPassword");
    });
  try {
    const result = await userDAO.createUser(
      "username",
      "name",
      "surname",
      "password",
      "role",
    );
  } catch (error) {
    expect(error).toStrictEqual(new UserAlreadyExistsError());
  }
  mockRandomBytes.mockRestore();
  mockDBRun.mockRestore();
  mockScrypt.mockRestore();
});

test("It should resolve true", async () => {
  const userDAO = new UserDAO();
  const mockDBRun = jest
    .spyOn(db, "run")
    .mockImplementation((sql, params, callback) => {
      callback(null);
      return {} as Database;
    });
  const mockRandomBytes = jest
    .spyOn(crypto, "randomBytes")
    .mockImplementation((size) => {
      return Buffer.from("salt");
    });
  const mockScrypt = jest
    .spyOn(crypto, "scrypt")
    .mockImplementation(async (password, salt, keylen) => {
      return Buffer.from("hashedPassword");
    });
  try {
    const result = await userDAO.createUser(
      "username",
      "name",
      "surname",
      "password",
      "role",
    );
  } catch (error) {
    expect(error).toBe(true);
  }
  mockRandomBytes.mockRestore();
  mockDBRun.mockRestore();
  mockScrypt.mockRestore();
});

test("Test di get all users", async () => {
  const userDAO = new UserDAO();
  const mockDBAll = jest
    .spyOn(db, "get")
    .mockImplementation((sql, params, callback) => {
      callback(null);
      return {} as Database;
    });
});
