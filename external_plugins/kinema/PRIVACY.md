# KINEMA by objekts — privacy and data handling

Updated 28 October 2026. Contact: salute@objekts.ai. Publisher: [objekts](https://objekts.ai).

## Skills-only plugin

The packaged skill contains research instructions and branding. It has no independent account system, analytics collector, payment service or database. Your assistant provider processes your conversation, supplied files, tool calls and research under its own policies and settings. The instructions do not grant independent access to private cinema accounts.

## Optional local MCP

The separate Node.js MCP server stores connected public-profile pointers, imported movie observations and recommendation feedback in a JSON file on the computer running it. The default path is `~/.local/share/objekts/cinema42.json`; `CINEMA42_DATA_FILE` can choose a separate file for a different viewer. The bundled tools do not send this archive to objekts. However, tools return selected history to the connected AI assistant, whose provider processes it under its policies. Local storage does not imply that the assistant never receives your data.

When you request a Letterboxd connection, the local server requests the specified public recent RSS feed from Letterboxd. Other supported profile links are pointers for research by your assistant. Search and browser tools can contact their respective services. The local server has no paid external model API or film-database key.

Use only your own history or data you are authorized to provide. Never put passwords, cookies or account tokens into chat or imported movie fields. Public visibility does not guarantee complete history or authorized automated bulk access.

## Retention

The local MCP has no automatic expiry or retention timer. Records remain in the configured local file until the user clears or removes that file. The skills-only package stores no independent copy; conversation and uploaded-file retention depend on the chosen assistant provider and the user’s account settings. Research providers receive queries and requested URLs according to their own policies.

## Deletion and separation

The local `delete_all_my_cinema_data` tool clears profiles, observations and feedback from its active JSON archive after an explicit request. You can also remove the local file. This does not delete the assistant provider's conversation records, operating-system backups, other viewer files or external cinema-service data; manage those through the relevant service or backup settings.

Do not publish personal histories in repository issues. For support, provide a minimal redacted reproduction. Public GitHub interactions are handled by GitHub. Studio contact messages are received through the contact channel you choose; do not include movie-account credentials.

This description applies to the included skills-only package and local server. A separately hosted deployment requires its own verified data-handling disclosure.
