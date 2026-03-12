# Full Auto-Qualification Implementation Guide

## Overview

This guide explains how to implement full auto-qualification where exporters with capital >= 75M ETB are automatically approved for ALL qualification stages and issued an export license immediately upon registration.

---

## Business Rules

### Capital Threshold: 75M ETB

**If capital >= 75M ETB:**
- ✅ Profile: Auto-approved
- ✅ Laboratory: Auto-approved (certificate generated)
- ✅ Taster: Auto-approved (certificate generated)
- ✅ Competence: Auto-approved (certificate generated)
- ✅ Export License: Auto-issued (license number generated)
- ✅ Status: `active` (fully qualified)
- ✅ Can export immediately

**If 50M <= capital < 75M ETB:**
- ✅ Profile: Auto-approved
- ❌ Laboratory: Requires ECTA approval
- ❌ Taster: Requires ECTA approval
- ❌ Competence: Requires ECTA approval
- ❌ Export License: Requires ECTA approval
- ⏳ Status: `approved` (can login, cannot export)

**If capital < 50M ETB:**
- ❌ Registration: Auto-rejected
- ❌ Cannot login

---

## Implement