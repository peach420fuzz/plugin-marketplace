// Host transport only. A successful transfer does not prove an image was generated.
export function handoffRoute(app, nativeHost) {
  const caps = app?.getHostCapabilities?.() ?? {};
  if (caps.message?.image && typeof app?.sendMessage === 'function') return 'mcp-message-images';
  if (caps.updateModelContext?.image && caps.message && typeof app?.updateModelContext === 'function' && typeof app?.sendMessage === 'function') return 'mcp-context-images';
  if (typeof nativeHost?.uploadFile === 'function' && typeof nativeHost?.setWidgetState === 'function' && typeof nativeHost?.sendFollowUpMessage === 'function') return 'chatgpt-files';
  return 'export';
}

function accepted(result, operation) {
  if (result?.isError) throw new Error(`${operation} was rejected by the host. Nothing has been confirmed generated.`);
  return result;
}

export async function imageBlock(file) {
  if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) throw new Error('Unsupported reference image format.');
  const bytes = new Uint8Array(await file.arrayBuffer());
  if (!bytes.length || bytes.length > 6 * 1024 * 1024) throw new Error('Reference image must be nonempty and at most 6 MB.');
  let binary = '';
  for (let i = 0; i < bytes.length; i += 8192) binary += String.fromCharCode(...bytes.subarray(i, i + 8192));
  return { type: 'image', mimeType: file.type, data: btoa(binary) };
}

export async function sendHandoff({app, getNativeHost, files, prompt, modelContent, stateVersion, assertCurrent, exportFiles}) {
  assertCurrent();
  const nativeHost = getNativeHost(); // Resolve on every click, after host initialization.
  const route = handoffRoute(app, nativeHost);
  if (route === 'export') {
    await exportFiles({files, prompt});
    return {status: 'EXPORTED', route};
  }
  if (route === 'mcp-message-images' || route === 'mcp-context-images') {
    const content = [];
    for (const {role, file} of files) {
      content.push({type: 'text', text: role}, await imageBlock(file));
    }
    assertCurrent();
    if (route === 'mcp-context-images') {
      accepted(await app.updateModelContext({content: [{type: 'text', text: modelContent}, ...content], structuredContent: {product:'FAKE by objekts', stateVersion, status:'PREPARED'}}), 'Image context');
      assertCurrent();
      accepted(await app.sendMessage({role:'user', content:[{type:'text', text:prompt}]}), 'Generation request');
    } else {
      accepted(await app.sendMessage({role:'user', content:[{type:'text', text:prompt}, ...content]}), 'Generation request');
    }
  } else {
    const imageIds = [];
    for (const {file} of files) {
      assertCurrent();
      const upload = await nativeHost.uploadFile(file, {library:false});
      if (typeof upload?.fileId !== 'string' || !upload.fileId.trim()) throw new Error('ChatGPT did not return a file ID. The generation request was not sent.');
      imageIds.push(upload.fileId);
    }
    assertCurrent();
    accepted(await nativeHost.setWidgetState({modelContent, privateContent:{stateVersion, handoff:'native-chatgpt'}, imageIds}), 'Image context');
    assertCurrent();
    accepted(await nativeHost.sendFollowUpMessage({prompt, scrollToBottom:true}), 'Generation request');
  }
  return {status:'SENT_TO_HOST', route, referenceCount:files.length};
}

export function auditionPrompt(compiled, version) {
  return [
    'FAKE by objekts — generate the authored fictional adult identity now using the image-generation tool available in this conversation.',
    'Create ONE photorealistic portrait, not a collage or contact sheet. Return the actual generated image. If the image tool is unavailable, say so explicitly; do not substitute a prompt or claim completion.',
    'Use the attached images according to their labeled roles. The approved Identity Master, when present, defines identity; the geometry board defines authored craniofacial proportions. Preserve distinctive proportions and asymmetry rather than averaging toward a generic attractive face.',
    'Render a living photographed person with credible skin texture, irregular pores, fine facial hair, moist eyes, natural eyelid edges and physically coherent light. The geometry board is a shape reference, not the intended clay material. No wax, mannequin skin, beauty smoothing or CGI finish.',
    compiled.replace(/^Create one photorealistic fictional adult character image, candidate 1\.\s*/i, ''),
    `Saved Character State v${version}. Do not change locked identity features. No external paid image API. A transfer acknowledgment is not a generated image.`,
  ].join('\n\n');
}
