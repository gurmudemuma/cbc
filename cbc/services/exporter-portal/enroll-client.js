/**
 * Enrollment script for Exporter Portal
 * 
 * IMPORTANT: Exporter Portal uses Commercial Bank's admin identity
 * This script copies the admin identity from Commercial Bank to Exporter Portal wallet
 * 
 * No separate identity is created - Exporter Portal acts on behalf of Commercial Bank
 */

import { Wallets } from "fabric-network";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  try {
    console.log("╔════════════════════════════════════════════════════════════╗");
    console.log("║     Exporter Portal Identity Setup                        ║");
    console.log("╚════════════════════════════════════════════════════════════╝");
    console.log("");
    console.log("📋 Strategy: Use Commercial Bank's admin identity");
    console.log("   • No separate identity for Exporter Portal");
    console.log("   • Exporters authenticated via JWT (not Fabric)");
    console.log("   • Scalable to unlimited exporters");
    console.log("");

    // Create wallet for Exporter Portal
    const exporterWalletPath = path.join(__dirname, "wallet");
    const exporterWallet = await Wallets.newFileSystemWallet(exporterWalletPath);

    // Check if admin identity already exists
    const existingAdmin = await exporterWallet.get("admin");
    if (existingAdmin) {
      console.log("✅ Admin identity already exists in Exporter Portal wallet");
      console.log("   MSP: " + existingAdmin.mspId);
      console.log("");
      console.log("╔════════════════════════════════════════════════════════════╗");
      console.log("║              Setup Complete - Ready to Use                 ║");
      console.log("╚════════════════════════════════════════════════════════════╝");
      return;
    }

    // Load admin identity from Commercial Bank wallet
    const commercialBankWalletPath = path.resolve(
      __dirname,
      "../commercial-bank/wallet"
    );

    if (!fs.existsSync(commercialBankWalletPath)) {
      console.error("❌ Commercial Bank wallet not found at:", commercialBankWalletPath);
      console.error("");
      console.error("Please enroll Commercial Bank admin first:");
      console.error("   cd ../commercial-bank && node enrollAdmin.js");
      process.exit(1);
    }

    const commercialBankWallet = await Wallets.newFileSystemWallet(commercialBankWalletPath);
    const adminIdentity = await commercialBankWallet.get("admin");

    if (!adminIdentity) {
      console.error("❌ Admin identity not found in Commercial Bank wallet");
      console.error("");
      console.error("Please enroll Commercial Bank admin first:");
      console.error("   cd ../commercial-bank && node enrollAdmin.js");
      process.exit(1);
    }

    // Copy admin identity to Exporter Portal wallet
    await exporterWallet.put("admin", adminIdentity);

    console.log("✅ Admin identity copied to Exporter Portal wallet");
    console.log("   MSP: " + adminIdentity.mspId);
    console.log("   Type: " + adminIdentity.type);
    console.log("");
    console.log("╔════════════════════════════════════════════════════════════╗");
    console.log("║              Setup Complete - Ready to Use                 ║");
    console.log("╚════════════════════════════════════════════════════════════╝");
    console.log("");
    console.log("Next steps:");
    console.log("  1. Start Exporter Portal: npm run dev");
    console.log("  2. Exporters can register/login via JWT");
    console.log("  3. All transactions submitted using CommercialBankMSP");

  } catch (error) {
    console.error("❌ Failed to setup identity:", error);
    process.exit(1);
  }
}

main();
