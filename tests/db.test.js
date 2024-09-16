import { expect } from "chai";
import dbClient from "../utils/db.js";
import sinon from "sinon";

describe("dbClient", function () {
  it("should have a property 'isAlive' that is a function", function () {
    expect(dbClient.isAlive).to.be.a("function");
  });

  it("should have a property 'db' that is an object", function () {
    expect(dbClient.db).to.be.an("object");
  });
  it("should have a property 'client' that is an object", function () {
    expect(dbClient.client).to.be.an("object");
  }); 
  it.skip("logs 'Connected to the database' to the console", function () {
    const consoleLog = sinon.stub(console, "log");
    dbClient.connect(); // Ensure the log statement is executed
    expect(consoleLog.calledWith("Connected to the database")).to.be.true;
    consoleLog.restore(); // Restore the stub
  });
  it("function 'isAlive' returns true", function () {
    expect(dbClient.isAlive()).to.be.true;
  });
});