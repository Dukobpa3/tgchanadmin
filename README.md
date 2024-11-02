# Ulysses-TG

This project is a Telegram bot designed for publishing richly formatted text, particularly from [Ulysses](https://ulysses.app/), but also compatible with other sources. It consists of a self-hosted server built with Express and the Grammy library for the Telegram API, and a Companion Shortcut that enables quick, formatted content sharing to specified channels and chats.

## Features

- **Extensive Formatting Support**: The bot automatically parses Ulysses-style markdown (`md-xxl`) and converts it to `tg-html` for optimal compatibility with Telegram.
- **Flexible Content Input**: The bot accepts any text-based file (`text/*` MIME type), allowing markdown documents and plain text alike to be processed.
- **TextBundle Compatibility with Ulysses**: Optimized for TextBundle from Ulysses, but will work with any compatible text source.
- **Channel and Chat Management**: Configuration allows setting up an approved list of channels and chats where the bot has admin privileges. The Shortcut queries these and offers a selection for where to post.
- **File System Compatibility**: The Shortcut supports sending files directly from the file system.
- **Rich-Format Only**: Currently supports text with rich formatting, excluding media, collapsed quotes, spoilers, and custom Telegram emojis. These are planned for future support.

## Installation

1. Clone the repository.
2. Install dependencies:
    ```bash
    npm install
    ```
3. Configure environment variables (`.env`) for your Telegram bot and list of approved channels/chats.
4. Start the server:
    ```bash
    npm start
    ```
5. Add the Companion Shortcut to your device and configure it to interact with the server.

## How It Works

1. Send text files to the bot through the Shortcut, either via the Share Menu or directly from the file system.
2. The Shortcut checks the available channels/chats and lets you select the destination.
3. The bot processes the text, applies formatting, and publishes it to Telegram.

## Future Plans

- Add media file support.
- Expand Telegram formatting support (collapsed quotes, spoilers, custom emojis).

## License

This project is licensed under the MIT License.

---

[Companion Shortcut](https://www.icloud.com/shortcuts/04d9ac9a52024427a1949c3d1fc32b2f)
