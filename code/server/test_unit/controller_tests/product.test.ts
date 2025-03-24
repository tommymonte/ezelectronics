import { test, expect, jest } from "@jest/globals";
import ProductController from "../../src/controllers/productController";
import ProductDAO from "../../src/dao/productDAO";

jest.mock("../../src/dao/productDAO");
