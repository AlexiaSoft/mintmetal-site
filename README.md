# MINT METAL marketing / landing site

Static marketing site for MINT METAL, a metal sheet ERP with Starter and Business packages, Subscription and License options, and add-on modules. There is no backend, database, Laravel, Composer, vendor directory, or Node server.

## Production domain and SEO

Target production domain: `https://mintmetal.alexiasoft.co/`. The canonical and Open Graph URLs, JSON-LD, `robots.txt`, and `sitemap.xml` are prepared for this domain. This repository is a deployment source; the site is not confirmed live until the deployed pages are checked on the server.

The current page titles and descriptions describe MINT METAL. Twitter cards use `summary` without an image. Add `og:image` and `twitter:image` only after a MINT METAL social share image is approved and available at a production URL. Do not substitute MINT ERP or MintHRM artwork.

## Preview locally

Open `index.html` in a browser to preview the site. Visitors can use the email and phone links in the final contact section.

## Static deployment handoff

The deployable document root needs these files and folders, preserving their relative paths:

```text
index.html
privacy.html
terms.html
robots.txt
sitemap.xml
assets/css/
assets/js/
assets/images/
```

Send a copy of this static file set to the deployer. Upload the contents into the document root for `mintmetal.alexiasoft.co` so `index.html` serves `/`, the legal pages serve `/privacy.html` and `/terms.html`, and `robots.txt` and `sitemap.xml` serve at the root. Ensure HTTPS is configured for the domain. No Node server, database, build step, or backend is required. Do not include `tests/`, `docs/`, or other internal source files in the public document root. No ZIP is created in this preparation round.

After deployment, check:

1. Open `https://mintmetal.alexiasoft.co/`, `/privacy.html`, and `/terms.html` over HTTPS; confirm each returns the intended page and its self-referencing canonical and matching `og:url`.
2. Check `robots.txt` and `sitemap.xml` at the domain root, and confirm all three sitemap URLs load.
3. Check desktop and mobile navigation, internal links, images, styles, JavaScript, and email/phone contact links.
4. Inspect the deployed page source for title, description, Open Graph, Twitter, and JSON-LD metadata; test social previews once an approved image is available.
5. Verify the domain in Google Search Console, submit `/sitemap.xml`, and inspect indexing results after the site is live.

Keep any future demo on its own subdomain and deployment. Do not place private employee data or credentials in this static site.

## Before publishing

- The screen gallery currently uses clearly labeled HTML/CSS placeholders. Replace them with approved MINT METAL screenshots when available.
- Confirm MINT METAL package scope, pricing, service terms, and VAT handling before treating the current prices as a binding quote.
- Confirm product scope, deployment options, contact details, and final Thai copy with the product owner.
- Add a real demo URL only after the demo environment is ready.
- Prepare an approved MINT METAL social share image, then add absolute `og:image` and `twitter:image` URLs before final social sharing review.

## Deployment exclusions

Do not publish these internal/source files in the production static site:

- `docs/index-before-pricing-copy-cleanup.html`
- `docs/pricing-model-history.md`
- `tests/`
- `assets/images/mint-hrm-logo.png` (unused legacy artwork)
- Internal audit and history files

Keep these files in source control; exclude them from the deployed document root.

## Production confirmation checklist

Confirm before deployment:

- Production server, HTTPS, and live URL checks
- Legal entity name and address
- Privacy and hosting practices
- Hosting and support scope
- License MA commercial policy
- Installation pricing
- VAT and billing terms
- Approved social share image

## Legal / Commercial items pending confirmation

- NEEDS CONFIRMATION: Privacy revision/effective date.
- NEEDS CONFIRMATION: Hosting/provider/logging/cookie behavior and technical data collection.
- NEEDS CONFIRMATION: Privacy legal bases, retention, security practices, provider list, and cross-border transfer wording.
- NEEDS CONFIRMATION: License MA rate and policy; the website uses neutral wording until finalized.
- NEEDS CONFIRMATION: Hosting / Backup / Standard Updates scope.
- NEEDS CONFIRMATION: Remote Support scope/hours.
- NEEDS CONFIRMATION: VAT treatment.
- NEEDS CONFIRMATION: Billing / renewal / cancellation.
- NEEDS CONFIRMATION: Project-document precedence.
- NEEDS CONFIRMATION: Custom deliverable IP treatment and any source-code ownership exceptions.
- NEEDS CONFIRMATION: Employee-count measurement and tier-change rules.
- NEEDS CONFIRMATION: Installation fees and any refund or late-payment terms.

## MINT METAL pricing model

- Packages: Starter and Business only.
- Subscription includes Cloud Hosting, Backup, MA, Support, Bug Fix, Security Update, and Minor / Standard Update within the agreed service scope.
- Installation / Setup is quoted separately. License excludes Hosting / Server / Infrastructure unless the quote says otherwise.
- Starter add-on prices and Business bundle savings are documented in [pricing-model-history.md](docs/pricing-model-history.md); the website retains those amounts.
- License MA from year two uses the rate defined by policy and the quote; no percentage is published until approved.
- Prices exclude VAT. Capacity, customization, migration, integration, and out-of-scope work are assessed separately.

This checklist is for internal review and is not customer-facing page copy.
