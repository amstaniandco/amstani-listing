# Amstani Listing Portal — Brand (Customer) Guide

Welcome! This guide walks you, as a **brand**, through everything from creating your
account to listing and managing your products on the Amstani Listing Portal. Read it
top to bottom the first time — each section builds on the last.

> **Who this guide is for:** Brand representatives ("customers"). Admin-only tasks
> (approving accounts, approving products, setting tax/shipping, creating categories)
> are mentioned only so you understand the workflow. You cannot perform them yourself.

---

## Table of contents

1. [How the portal works (the big picture)](#1-how-the-portal-works-the-big-picture)
2. [Step 1 — Sign up for a brand account](#2-step-1--sign-up-for-a-brand-account)
3. [Step 2 — Wait for admin approval](#3-step-2--wait-for-admin-approval)
4. [Step 3 — Log in](#4-step-3--log-in)
5. [Step 4 — Your dashboard](#5-step-4--your-dashboard)
6. [Step 5 — Categories](#6-step-5--categories)
7. [Step 6 — Add a product (every field explained)](#7-step-6--add-a-product-every-field-explained)
8. [Step 7 — Understand the approval status](#8-step-7--understand-the-approval-status)
9. [Step 8 — Manage your products (view, edit, enable, delete)](#9-step-8--manage-your-products-view-edit-enable-delete)
10. [Your profile](#10-your-profile)
11. [Logging out](#11-logging-out)
12. [What you can and cannot do (quick reference)](#12-what-you-can-and-cannot-do-quick-reference)
13. [Messages you might see (and what they mean)](#13-messages-you-might-see-and-what-they-mean)
14. [Frequently asked questions](#14-frequently-asked-questions)

---

## 1. How the portal works (the big picture)

The portal is a place where **brands list products** and an **admin approves them**
before they go live. Nothing you create appears in the catalog automatically — an admin
reviews it first. The whole experience follows one repeating loop:

```
You create / edit something  →  It enters PENDING (awaiting admin review)
        →  Admin APPROVES or REJECTS  →  You publish (if approved) or fix & resubmit (if rejected)
```

This applies to **two** things:

- **Your account** — an admin must approve it before you can even log in.
- **Each product** — an admin must approve it before you can make it visible in the store.

Keep this loop in mind and the rest of the portal will make sense.

---

## 2. Step 1 — Sign up for a brand account

**Where:** Go to the **`/signup`** page (titled *"Create a brand account request"*).

You are submitting a **registration request**, not creating an instant account. An admin
reviews and approves brand accounts before anyone can sign in.

### Fields on the signup form

Fill in **all** of these — every field is required:

| Field | What to enter | Rules |
|---|---|---|
| **Full name** | Your name (e.g., *Mia Carter*) | At least 2 characters |
| **Brand** | Pick your brand from the dropdown | You must select one; you **cannot type a new brand**. Only brands already set up by the admin appear here. |
| **Email** | Your work email (e.g., *brand@company.com*) | Must be a valid email and not already registered |
| **Phone number** | A reachable number (e.g., *+1 415 555 0148*) | At least 7 characters |
| **Password** | A password you'll remember | At least 8 characters. Click the eye icon to show/hide it. |
| **Confirm password** | Type the same password again | Must match the password above |

> **Don't see your brand in the dropdown?** Your brand hasn't been set up by the admin
> yet. Contact your admin / support to have it added before you sign up.

### Submitting

Click **"Submit brand request"**. You'll see:

> *"Request submitted. An admin will review your account before you can log in."*

You're then sent to the **login page**. **There is no email confirmation link** — the
next step is human approval, not clicking a verification email.

---

## 3. Step 2 — Wait for admin approval

After you submit, your account sits in a **PENDING** state. An admin will:

- **Approve** your account → you can now log in, **or**
- **Block** your account → you won't be able to log in.

There is **no automatic email** telling you when this happens — approval is a manual step
on the admin's side. If you've waited and still can't log in, reach out to your admin or
support contact.

If you try to log in before you're approved, you'll see:

> *"Your account is pending admin approval."*

---

## 4. Step 3 — Log in

**Where:** The **`/login`** page (titled *"WELCOME TO THE PORTAL"*).

| Field | What to enter |
|---|---|
| **Email** | The email you signed up with |
| **Password** | Your password (eye icon shows/hides it) |

Click **"Sign in"**. On success you'll see *"Welcome back."* and land on your
**Brand dashboard**.

### If sign-in fails

- **"Invalid email or password."** — Wrong email or password. (For your security, the
  message is the same whether the email exists or not.)
- **"Your account is pending admin approval."** — You're approved-pending; wait for the admin.
- **"This account has been suspended. Contact support."** — Your account was blocked.

> **No "Forgot password" option exists yet.** If you're locked out, contact your admin /
> support to help reset access.

---

## 5. Step 4 — Your dashboard

After logging in you arrive at **`/brand/dashboard`** — *"Track your product listings at a
glance."*

### The navigation menu

Every page has the same menu:

- **Dashboard** → `/brand/dashboard`
- **Categories** → `/brand/categories`
- **Products** → `/brand/products`
- **Profile** → `/profile`

### The dashboard at a glance

At the top you'll see three stat cards:

- **Total Products** — every product you've created.
- **Published** — products currently visible in the store.
- **Drafts** — products not yet published (saved as drafts or not yet approved/enabled).

Below that, a **Recent Products** list shows your 5 most recent products with their name,
SKU, a **Published** (green) or **Draft** (gray) badge, price, and the date you created them.

---

## 6. Step 5 — Categories

**Where:** **`/brand/categories`**.

Categories describe what your products are. You **pick** from existing categories when
creating a product — you don't create categories directly. But you **can request a new
one**.

### Left side — Available categories

A searchable list of all categories the admin has approved. These are the ones you'll be
able to tick when adding a product. Use the **Search** box to filter them.

### Right side — Request a new category

If the category you need doesn't exist:

1. Type the name in the **"New category name"** box (at least 2 characters).
2. Submit it (the **+** button).
3. You'll see: *"Category request submitted for admin review."*

### Your requests

Below the form, the **"Your requests"** table lists every category you've requested, each
with a status:

- **PENDING** — waiting for the admin.
- **APPROVED** — now available; you can select it on your next product.
- **REJECTED** — the admin declined it.

> **Tip:** If you need a brand-new category for a product, request it **first**, wait for
> approval, then create the product so you can tick the new category.

---

## 7. Step 6 — Add a product (every field explained)

**Where:** Go to **`/brand/products`** and click **"+ Add product"**. A dialog titled
**"Add New Product"** opens. Its subtitle reminds you: *"All fields are required."* (a few
are genuinely optional — those are noted below).

The form is organized into sections. Here's every field, top to bottom.

### Basic Information

| Field | What to enter | Notes |
|---|---|---|
| **Product Name** | e.g., *Premium Cotton T-Shirt* | At least 3 characters |
| **SKU** | Your product code, e.g., *TSH-001* | At least 2 characters |
| **Brand** | *(locked)* | Auto-assigned from your account — you can't change it |
| **Categories (select at least one)** | Tick one or more categories | At least **one** is required |
| **Short Description** | A brief blurb for listings | Optional — if blank, the first 160 characters of the full description are used |
| **Full Description** | Detailed description of the product | At least 10 characters |

### Pricing & Inventory

| Field | What to enter | Notes |
|---|---|---|
| **Wholesale Price (Rs)** | Your wholesale price, e.g., *0.00* | Required. You can change it later by editing the product (editing resends it for admin approval). |
| **Stock Status** | *In stock* / *Low stock* / *Out of stock* | Required |
| **Total Stock** | Total units available, e.g., *0* | Required, 0 or more |
| **Visibility** | *Published* or *Draft* | Defaults to *Published* — but a product only actually goes live after admin approval (see below) |
| **Featured product** | Tick to flag it as featured | Optional |

> **About price:** You set the *wholesale* price. After approval, the admin applies tax
> and shipping to calculate the final retail price. You won't see or set those admin
> overrides. You **can** change the wholesale price later by editing the product — but any
> edit resends it for admin approval, so it'll need to be re-approved before it's live again.

### Variants (at least one required)

A product needs at least one variant. Use **"+ Add Variant"** to add rows. Each row has:

- **Size** — XS, S, M, L, XL, XXL, or Custom
- **Color** — e.g., *Pink*
- **Stock** — units for that variant
- **Variant SKU** — e.g., *SKU-S-PINK*

Each row has a delete button to remove it.

### Size Chart (at least one row required)

A measurement table for your product.

- Click **"Manage Variables"** to choose which measurements appear (e.g., *height*,
  *width*, *length*, or custom ones like *chest* / *waist*). Variables may be pre-filled
  from the categories you selected. Changes here affect **only this product**.
- Add rows with **"+ Add Size Row"**. Each row has:
  - **Size** — XS … XXL or Custom
  - One field per measurement variable
  - **Unit** — *cm* or *in*

### Product Images (at least one required)

- Click **"Click to upload images"** (or drag and drop).
- Allowed: **PNG, JPG, WEBP, GIF, up to 10MB each**. You can upload several.
- Uploaded images show as thumbnails; remove any with the trash icon.
- The **first** image becomes the product's main image.

### Shipping Information

| Field | What to enter | Notes |
|---|---|---|
| **Weight (kg)** | e.g., *0.5* | Required, 0 or more |
| **Dimensions (L × W × H in cm) — optional** | Length, Width, Height | All three are optional — leave blank if unknown |

### SEO

| Field | What to enter |
|---|---|
| **SEO Title** | A search-friendly title (required) |
| **SEO Description** | A search-friendly description (required) |

### Submitting the product

Click **"Create Product"**. You'll see:

> *"Product submitted for admin approval."*

The product is now **PENDING** and **not yet visible** in the store — even if you chose
*Published* under Visibility. Visibility only takes effect after an admin approves it and
you enable it.

#### Quick checklist before you submit

- [ ] Product name (3+ chars) and SKU (2+ chars)
- [ ] At least one category ticked
- [ ] Full description (10+ chars)
- [ ] Wholesale price set (you can edit it later, but that resends it for approval)
- [ ] Total stock entered
- [ ] At least one variant with size, color, and variant SKU
- [ ] At least one size-chart row
- [ ] At least one image uploaded
- [ ] Weight entered
- [ ] SEO title and SEO description filled in

---

## 8. Step 7 — Understand the approval status

Every product has an **approval status**. You'll see it in the **Approval** column of your
products table.

| Status (badge) | What it means | What you can do |
|---|---|---|
| **Awaiting approval** (PENDING, yellow) | Admin hasn't reviewed it yet | View it, edit it (resubmits). **You can't enable/publish it yet.** |
| **Approved** (green) | Admin approved it | View, edit (note: editing sends it **back to PENDING**), and **Enable** it to make it visible in the store |
| **Rejected** (red) | Admin declined it; a reason is shown | Read the reason, then click **"Edit & resubmit"** to fix and send it back for review |

Key rules to remember:

- **A new product always starts as PENDING.**
- **Any edit you make sends the product back to PENDING and un-publishes it** — the admin
  re-reviews after every change. This is normal.
- **You can only enable (publish) a product that is APPROVED.** The Enable button is
  disabled otherwise, with the tooltip *"Awaiting admin approval."*
- If a product was **Rejected**, editing it clears the rejection reason and resubmits it.

---

## 9. Step 8 — Manage your products (view, edit, enable, delete)

**Where:** **`/brand/products`**.

### The products table

Columns you'll see:

- **Image** (thumbnail) · **Product Name** · **SKU** · **Brand** · **Category** (first two,
  then "…") · **Stock** · **Approval** (status badge, with rejection reason if rejected) ·
  **Listing** (*Published* or *Disabled*) · **Actions**

Use the **search box** to filter by product **name** or **SKU**.

### Actions on each product

- **View** — Opens a read-only view of all the product's details.
- **Edit** — Opens the **"Edit Product"** dialog. *"Update product details. Editing
  resubmits the product for approval."*
  - You **can** update the **wholesale price** here (along with the other fields).
  - Saving **resubmits the product for approval** (it returns to PENDING and un-publishes).
  - You'll see *"Product updated — resubmitted for admin approval."*
  - For a rejected product, this button reads **"Edit & resubmit."**
- **Enable / Disable** — Controls whether an **approved** product is visible in the store.
  - **Enable** is only available once the product is **Approved**. Before that it's greyed
    out with the tooltip *"Awaiting admin approval."*
  - Messages: *"Product enabled."* / *"Product disabled."*
- **Delete** — Permanently removes the product.
  - A confirmation appears: **"Delete product?"** — *"This permanently removes the listing
    from the catalog."*
  - Click **Delete** to confirm. You'll see *"Product deleted."*
  - ⚠️ **This cannot be undone.** There is no trash/recover. Be sure before deleting.

---

## 10. Your profile

**Where:** **`/profile`** (*"Account details"*).

This page shows your account info, **read-only**:

- **Name**
- **Email**
- **Role** — shown as *"Brand representative"*
- **Brand** — your brand's name

There's currently **no way to edit these from the portal**. To change your details, contact
your admin / support.

---

## 11. Logging out

Use the logout option to end your session. You'll be returned to the **login page** and
your session is cleared.

---

## 12. What you can and cannot do (quick reference)

### ✅ You CAN

- Create products (each goes to the admin for approval)
- Edit your own products, **including the wholesale price** (resubmits them for approval)
- Delete your own products (permanent)
- Enable / disable your **approved** products (control store visibility)
- See each product's approval status and any rejection reason
- Request new categories and track those requests
- Browse available categories
- View your profile
- Log out

### ❌ You CANNOT

- Log in before an admin approves your account
- Create a brand (you select an existing one at signup)
- Create categories directly (you can only **request** them)
- Approve or reject products (only admins can)
- See or set admin tax/shipping overrides
- See or manage another brand's products
- Access any admin pages
- Edit your profile details in the portal (currently view-only)

---

## 13. Messages you might see (and what they mean)

| Message | When | Meaning |
|---|---|---|
| *"Request submitted. An admin will review your account before you can log in."* | After signup | Your account is pending admin approval |
| *"An account with that email already exists."* | At signup | Use a different email or log in |
| *"Your account is pending admin approval."* | At login | Wait for the admin to approve your account |
| *"This account has been suspended. Contact support."* | At login | Your account was blocked |
| *"Invalid email or password."* | At login | Wrong credentials |
| *"Welcome back."* | At login | Success — you're in |
| *"Product submitted for admin approval."* | After creating a product | It's now PENDING |
| *"Product updated — resubmitted for admin approval."* | After editing a product | Edit saved; back to PENDING |
| *"Product enabled." / "Product disabled."* | Toggling visibility | Store visibility changed |
| *"Product deleted."* | After deleting | Removed permanently |
| *"Category request submitted for admin review."* | After requesting a category | Request is PENDING |

---

## 14. Frequently asked questions

**Q: I signed up but can't log in. Why?**
A: Your account must be approved by an admin first. Until then you'll see *"Your account is
pending admin approval."* There's no confirmation email — approval is manual.

**Q: My brand isn't in the signup dropdown.**
A: Only brands the admin has set up appear there. Ask your admin/support to add your brand,
then sign up.

**Q: I forgot my password.**
A: There's no self-service reset yet. Contact your admin/support to regain access.

**Q: I set my product to "Published" but it's not in the store.**
A: Visibility only applies after an admin **approves** the product and you **Enable** it.
Until approval, the Enable button is disabled.

**Q: I edited an approved product and now it says "Awaiting approval" again.**
A: That's expected. Every edit sends the product back to the admin for re-review and
temporarily un-publishes it.

**Q: I entered the wrong price. Can I fix it?**
A: Yes. Open the product, click **Edit**, update the **Wholesale Price**, and save. Like any
edit, this resubmits the product for admin approval, so it returns to PENDING until the admin
re-approves it.

**Q: My product was rejected. What now?**
A: Read the rejection reason shown on the product, click **"Edit & resubmit,"** fix the
issue, and save. It returns to PENDING for another review.

**Q: Can I delete a product and get it back later?**
A: No. Deletion is permanent — there's no recovery. Disable it instead if you only want to
hide it.

**Q: Can I add a category that doesn't exist?**
A: You can't create one directly, but you can **request** it on the Categories page. Once
the admin approves it, you can select it on your products.

---

*That's the full brand workflow. The pattern to remember: **create → admin approves →
publish**, and every edit restarts that review. Happy listing!*
