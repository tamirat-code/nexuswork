import { jest } from "@jest/globals";

const send = jest.fn();

const S3Client = jest.fn(function S3Client() {
  this.send = send;
});

const PutObjectCommand = jest.fn(function PutObjectCommand(input) {
  this.input = input;
});

const GetObjectCommand = jest.fn(function GetObjectCommand(input) {
  this.input = input;
});

const getSignedUrl = jest.fn();

jest.unstable_mockModule("@aws-sdk/client-s3", () => ({
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
}));

jest.unstable_mockModule("@aws-sdk/s3-request-presigner", () => ({
  getSignedUrl,
}));

jest.unstable_mockModule("../../src/config/storage.config.js", () => ({
  storageConfig: {
    region: "us-east-005",
    endpoint: "https://s3.us-east-005.backblazeb2.com",
    forcePathStyle: true,
    accessKey: "key-id",
    secretKey: "application-key",
    bucket: "nexuswork",
  },
}));

const { uploadToS3 } =
  await import("../../src/shared/utils/s3.client.js");

describe("uploadToS3", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    send.mockResolvedValue({});

    getSignedUrl.mockResolvedValue(
      "https://s3.us-east-005.backblazeb2.com/avatars/avatars%2Fuser-1.png"
    );
  });

  it("uploads an object without a canned ACL and returns a signed URL", async () => {
    await expect(
      uploadToS3({
        bucket: "avatars",
        key: "avatars/user-1.png",
        body: Buffer.from("image"),
        contentType: "image/png",
      })
    ).resolves.toBe(
      "https://s3.us-east-005.backblazeb2.com/avatars/avatars%2Fuser-1.png"
    );

    expect(PutObjectCommand).toHaveBeenCalledWith({
      Bucket: "avatars",
      Key: "avatars/user-1.png",
      Body: expect.any(Buffer),
      ContentType: "image/png",
    });

    expect(GetObjectCommand).toHaveBeenCalledWith({
      Bucket: "avatars",
      Key: "avatars/user-1.png",
    });

    expect(getSignedUrl).toHaveBeenCalledWith(
      expect.anything(),
      expect.any(GetObjectCommand),
      {
        expiresIn: 86400,
      }
    );
  });
});