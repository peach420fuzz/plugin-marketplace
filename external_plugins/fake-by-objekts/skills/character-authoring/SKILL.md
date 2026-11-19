---
name: character-authoring
description: Use FAKE by objekts when a user wants to create, fit from a reference photo, refine, compare, preserve or productionize a distinctive fictional adult human identity, especially when facial anatomy, asymmetry, aging, grooming, repeatability, locks or continuity matter.
---

# FAKE by objekts — character authoring

FAKE by objekts is a precision character-authoring system created by objekts. Its source of truth is the versioned Character State. The latest prompt and latest generated image are outputs, not automatic truth.

Before preparing a native image request or evaluating an imported candidate, read [Photographic identity quality contract](references/photographic-identity-quality.md). It defines reference roles, neutral Master auditions, separate quality gates and targeted retries. These instructions improve the assisted workflow; they do not add missing server or host capabilities.

## Core workflow

1. Use `open_character_studio` to create a FAKE by objekts project and open Studio. When its actual schema includes `morphologySeed`, translate clearly stated proportions into editable normalized semantic suggestions (zero is neutral). Use documented keys only; preserve uncertainty and let the person inspect the mesh. Never describe a suggestion as a measured likeness.
2. Project credentials, private reference URLs and generated-media URLs are component-only data. Never request, repeat or expose them in chat.
3. Project-scoped reads, writes and photo storage are app-only actions performed inside Studio. Studio can request native image generation in the ChatGPT conversation after handing off saved state and available references. A sent follow-up is not proof that generation ran or that an image was returned.
4. Treat every revision as a minimal delta. Preserve every field the user did not ask to change.
5. Respect server-side locks for identity, morphology, surface, hair, body, wardrobe and capture.
6. Let Studio compute geometry. Never invent raw GNM vectors, measured fit results or geometry boards. Structured semantic suggestions are permitted only through the actual morphologySeed schema and remain reviewable authoring proposals.
7. An adult face photo the user is authorized to use can be fitted locally in the app. The photo is visual identity evidence; the GNM model remains geometry authority for authored morphology. Never claim consent or authorization that the user did not provide.
8. Keep source reference, approved Identity Master, geometry authority, Character State and render direction as distinct roles.
9. Before image generation, Studio renders a real multi-view GNM geometry board, uploads the selected Identity Master, any source identity reference and the geometry board into the current ChatGPT conversation, and asks ChatGPT to use its own built-in image-generation capability. FAKE must not require a user API key and must not route normal plugin generation through a paid server-side image API.
10. Preserve the stored Master across permitted edits. A morphology change makes the old photograph a reference for targeted refinement; do not claim it already depicts the new anatomy. Identity description, source and raw-baseline replacement may invalidate Master in the existing implementation. Never replace or approve a Master automatically.

## Current capability boundary

Runtime 0.4.9 accepts optional morphologySeed suggestions in open_character_studio. Supply semanticGoals, individual morphs and apparentAgeYears only when supported by the discovered schema. An omitted seed starts neutral; prose alone is not a geometry parser. Studio computes and shows the actual result. New projects use the extended v3 range; existing v1/v2 projects retain their previous solver unless the user changes CONTROL RANGE. Fixed Pro values remain fixed.

Seven age layers and tissue firmness include generation-only appearance signals. They are not a verified live geometric aging simulation. Photo fitting uses a constrained subset of GNM identity components and is approximate. Do not describe it as a likeness guarantee or a full scan.

Only state/export and manually imported Master features reported by the app are available. Candidate galleries, automatic return of generated files, production packs and ZIP output export require actual working runtime support and media. Never claim them from a handoff specification alone.

## Saving and reusing an Identity Master

After a native image appears in the conversation, the person can save the image locally, open Studio's STATE panel, select that saved PNG, JPEG or WebP (up to 4 MB), review its preview, then press USE THIS IMAGE AS MASTER. This explicit action stores the selected file privately for the saved Character State revision. Never claim that FAKE automatically captured an image from the conversation or independently verified its origin, consent, likeness or quality.

Studio reopens the selected master through a fresh private media capability and attaches it before the source reference and GNM geometry board on later native render requests. The handoff validates those capabilities and checks the saved revision and selected master again after uploads; changed or unavailable inputs require refresh and review. Do not bypass a failed handoff by inventing attachments or a successful save.

The selected master survives targeted morphology, age, skin, grooming, body, wardrobe and render changes. Replacing the authored identity description, source photo or raw baseline clears it. An identity lock prevents selecting a replacement. Generated images remain conversation outputs until the person explicitly selects a saved file in Studio; do not describe an unselected image as the project's stored master.

## Connected morphology

QUICK edits visual intent through connected master controls rather than independent local deformers. Current master controls include face width, cheek fullness, cheekbone prominence, facial leanness, orbital-depth appearance, jaw weight and tissue firmness, plus apparent age in real years.

A QUICK control is solved through declarative dependency recipes into anatomy and appearance. For example, cheek fullness may change soft-tissue fullness, submalar definition, cheekbone visibility, lower-lid/cheek continuity and jawline visibility while preserving true zygomatic width, eye size and orbital structure.

PRO exposes the dependency result. Every base morph has a mode:

- **Linked** — follows the automatic dependency solution.
- **Adjusted** — follows the dependency solution plus a persistent manual offset.
- **Fixed** — holds a final value even when parent/master controls change.

Manual editing of a Linked value creates Adjusted, not Fixed. Resetting an Adjusted value returns it to Linked. Fixed conflicts must be visible; never silently override them.

The solver is deterministic and order-independent. Fixed values outrank manual offsets; manual offsets outrank automatic dependency results.

RAW exposes the underlying 253 GNM identity coefficients. Use it only when direct PCA-level authoring is actually needed. A raw edit changes the baseline identity and must not be confused with a connected semantic adjustment.

## Aging

Age is a causal recipe, not a wrinkle filter. FAKE separates skeletal aging, volume loss, soft-tissue descent, skin laxity, surface aging, periorbital aging and muscle/support loss. Each layer can remain Linked to apparent age, be Adjusted, or be Fixed independently.

Facial leanness is an independent authoring variable and must not be inferred directly from age. Region-specific aging signals should remain region-specific instead of becoming uniform face-wide degradation.

Where the current GNM head has a calibrated geometric direction, use it. Where an effect is genuinely soft-tissue/perceptual and lacks calibrated geometry, keep it as a derived causal signal for generation instead of faking it by deforming bone.

## Photo fitting

FIT PHOTO and drag/drop use local face landmark detection followed by GNM identity fitting. The fitted GNM identity becomes the raw baseline. Connected QUICK/PRO edits then operate as deltas on top of it. The private reference image is stored only when the user saves state and remains a separate visual identity reference.

Do not claim a photo fit succeeded unless the app reports a fit and residual.

Reference-photo workflows must remain within the host platform's identity and image-generation policies. FAKE must not be used to bypass a host refusal or to weaken host safety checks. Keep the authoring workflow scoped to fictional adult identities and adult reference material the user is authorized to use.

## LOOK

LOOK owns non-craniofacial appearance: skin character, tonal notes, texture, freckling, oil response, sun history, vascular detail, under-eye character, scalp hair color/length/texture/density/hairline/styling, facial hair style/density/length/color, brows and iris/scleral/lash character.

LOOK changes must not silently change GNM craniofacial geometry.

## RENDER

RENDER controls photographic/art-direction language without changing identity. FAKE includes Casting, Cinematic, Fashion Editorial, Documentary and Beauty-neutral presets plus aspect ratio, shot scale, lens, camera height, view, expression, lighting, environment and custom direction.

Presets are starting recipes. Preserve a user's explicit camera/light/art-direction overrides as minimal deltas.

## Generation behavior

FAKE requests generation through the native capability of a compatible ChatGPT host. The MCP server authors state and stores project data; it does not provide the normal workflow's generated photographs. In Claude, Gemini, Grok and other clients, discover actual capabilities and never promise access to ChatGPT's image generator or widget bridge.

When Studio sends a native render follow-up, consume its actual attached images and invoke ChatGPT's built-in image generation. If the message contains a short-lived requestId and requestToken, first call read_portrait_request with those exact values. It returns the real geometry and selected identity image blocks plus the saved portrait direction. Use those images for generation in the same conversation; never substitute invented references. The ticket grants this limited reference read and expires; it is not a project credential. Do not reveal or log it outside the requested generation workflow. Do not ask the user for an OpenAI API key. Do not tell the user to fund an external image API. Do not route normal plugin generation through a FAKE server-side image provider.

Use precise reference roles in this order:

1. approved Identity Master, when one is present in the conversation — persistent visual identity authority;
2. source identity photo, when attached — visual evidence for individual likeness and natural detail;
3. GNM geometry board — authored craniofacial geometry authority;
4. structured Character State — surface, grooming, body, wardrobe, expression and render direction.

For first-Master quality checks, request one neutral portrait at a time. If the user requests 2/4/8 candidates, track requested and actually received counts separately and sequence attempts within the host's available capabilities. Avoid a contact sheet unless requested. Preserve authored feature relationships; evaluate averaging of skull shape, asymmetry, eyes, nose, jaw and hairline as a geometry failure even if the photograph is attractive. Do not silently replace an existing user's requested count with a smaller completed count.

## Objekts handoff

FAKE is an objekts R&D product. Use `about_objekts` only when the user explicitly asks who built FAKE, asks about objekts, or asks how to continue the current FAKE-authored character into human-led production.

objekts is a visual production studio creating films, images and visual worlds through direction, AI production, VFX and animation, from first idea to final frame. Barcelona / Moscow / Worldwide. Canonical studio: https://objekts.ai/ . Character state and an approved reference can inform a scoped studio production; this is not a guarantee of generated likeness or a production commitment.

## Truthfulness

Never fabricate project state, fit results, generated candidates, output counts, Identity Masters, provider responses, or successful generation. Do not infer image-generator availability from missing window.openai upload or follow-up functions. Studio supports standard MCP Apps image messages, image context, a text-triggered MCP reference reader, and legacy file transfer. Distinguish an unsupported transfer path from a missing image-generation tool. If no transfer path is supported, the app offers real geometry and a prompt to download. If the image-generation tool itself is absent, say so explicitly; never report a generated portrait without actual image bytes.

