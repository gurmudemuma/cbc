/**
 * Enrollment script for Exporter Portal Client
 * Creates a client identity that can connect through Commercial Bank's peer
 */

import { Wallets } from "fabric-network";
import FabricCAServices from "fabric-ca-client";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  try {
    // Load connection profile
    const ccpPath = path.resolve(
      __dirname,
      "../../network/organizations/peerOrganizations/commercialbank.coffee-export.com/connection-commercialbank.json",
    );

    if (!fs.existsSync(ccpPath)) {
      console.error(`Connection profile not found at: ${ccpPath}`);
      process.exit(1);
    }

    const ccp = JSON.parse(fs.readFileSync(ccpPath, "utf8"));

    // Create CA client (with fallback if certificateAuthorities not present in JSON)
    let caInfo =
      ccp.certificateAuthorities &&
      ccp.certificateAuthorities["ca.commercialbank.coffee-export.com"]
        ? ccp.certificateAuthorities["ca.commercialbank.coffee-export.com"]
        : undefined;

    if (!caInfo) {
      // Attempt fallback: construct CA info using known local network artifacts
      const fallbackPemPath = path.resolve(
        __dirname,
        "../../network/organizations/peerOrganizations/commercialbank.coffee-export.com/ca/ca.commercialbank.coffee-export.com-cert.pem",
      );

      let fallbackPem = "";
      if (fs.existsSync(fallbackPemPath)) {
        try {
          fallbackPem = fs.readFileSync(fallbackPemPath, "utf8");
        } catch (readErr) {
          console.warn(
            `Warning: unable to read fallback CA pem at ${fallbackPemPath}:`,
            readErr.message || readErr,
          );
        }
      }

      caInfo = {
        url: "https://localhost:7054",
        caName: "ca-CommercialBank",
        tlsCACerts: { pem: fallbackPem },
      };

      console.log(
        `🔁 Using fallback CA info (pem loaded: ${fallbackPem ? "yes" : "no"})`,
      );
    }

    const caTLSCACerts = caInfo.tlsCACerts.pem;
    const ca = new FabricCAServices(
      caInfo.url,
      { trustedRoots: caTLSCACerts, verify: false },
      caInfo.caName,
    );

    // Create wallet
    const walletPath = path.join(__dirname, "wallet");
    const wallet = await Wallets.newFileSystemWallet(walletPath);

    // Check if client identity already exists
    const clientIdentity = await wallet.get("exporterClient");
    if (clientIdentity) {
      console.log("Exporter client identity already exists in wallet");
      return;
    }

    // Check if admin identity exists (needed for registration)
    const adminIdentity = await wallet.get("admin");
    if (!adminIdentity) {
      console.log("Admin identity not found. Please enroll admin first.");
      console.log("Run: cd ../commercial-bank && node enroll-admin.js");
      return;
    }

    // Build user object for authenticating with CA
    const provider = wallet
      .getProviderRegistry()
      .getProvider(adminIdentity.type);
    const adminUser = await provider.getUserContext(adminIdentity, "admin");

    // Register the client user
    const secret = await ca.register(
      {
        affiliation: "org1.department1",
        enrollmentID: "exporterClient",
        role: "client",
        attrs: [
          { name: "role", value: "exporter", ecert: true },
          { name: "organization", value: "exporter-portal", ecert: true },
        ],
      },
      adminUser,
    );

    // Enroll the client user
    const enrollment = await ca.enroll({
      enrollmentID: "exporterClient",
      enrollmentSecret: secret,
    });

    // Create identity object
    const x509Identity = {
      credentials: {
        certificate: enrollment.certificate,
        privateKey: enrollment.key.toBytes(),
      },
      mspId: "CommercialBankMSP",
      type: "X.509",
    };

    // Put identity in wallet
    await wallet.put("exporterClient", x509Identity);
    console.log("Successfully enrolled exporter client and imported to wallet");
  } catch (error) {
    console.error("Failed to enroll exporter client:", error);
    process.exit(1);
  }
}

main();
