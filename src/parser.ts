import {config} from "../config.js";


export function convertUlyssesToTelegramHtml(input: string): string {
    return input
        .replace(/~(.*?)~/g, (match, code) => {
            return `<pre>${escapeHtml(code)}</pre>`
        }) // Preformat
        .replace(/```(.*?)\n([\s\S]*?)```/g, (match, lang, code) => {
            return `<pre><code class="language-${lang}">${escapeHtml(code)}</code></pre>`
        }) // Code block
        .replace(/`(.*?)`/g, (match, code) => {
            return `<code>${escapeHtml(code)}</code>`
        }) // Inline code
        .replace(/(^|\n)(>.*?\n)+/g, (match) => {
            return `\n<blockquote>${match.replace(/^> ?/gm, '').trim()}</blockquote>\n`
        }) // Quote

        .replace(/\|\|(.*?)\|\|/g, '<span class="tg-spoiler">$1</span>') // Spoiler
        .replace(/\*\*(.*?)\*\*/g, '<b>$1</b>') // Bold
        .replace(/__(.*?)__/g, '<u>$1</u>') // Underline
        .replace(/_(.*?)_/g, '<i>$1</i>') // Italic
        .replace(/~(.*?)~/g, '<s>$1</s>') // Stroke

        .replace(/(^|\n)#{2,}\s(.*?)\n/g, (match, p1, p2) => {
            return `\n<strong>${markP2(p2)}</strong>\n`
        }) // Header 2
        .replace(/(^|\n)#\s(.*?)\n/g, (match, p1, p2) => {
            return `\n<strong>${markP1(p2)}</strong>\n`
        }) // Header 1

        .replace(/(^|\n)(\s+[*-].*?)(?=\n)/g, (match, p1, p2) => {
            return `\n   ${markList2(p2)}`
        }) // List 2
        .replace(/(^|\n)([*-].*?)(?=\n)/g, (match, p1, p2) => {
            return `\n ${markList1(p2)}`
        }) // List 1

        .replace(/!?\[(.*?)\]\((.*?)\)/g, '<a href="$2">$1</a>') // Link

        .replace(/\n\n\n/g, '\n\n') // Prune new lines
        .replace(/<\/pre>\n\n/g, '</pre>\n'); // Prune new lines

}

function escapeHtml(input: string): string {
    return input
        .replace(/&/g, '&amp;') // Change & to &amp;
        .replace(/</g, '&lt;') // Change < to &lt;
        .replace(/>/g, '&gt;'); // Change > to &gt;
}

function markP1(input: string): string {
    const marker = config.format.header.first ? `${config.format.header.first} ` : ``;
    return `${marker}${input}`;
}

function markP2(input: string): string {
    const marker = config.format.header.first ? `${config.format.header.second} ` : ``;
    return `${marker}${input}`;
}

function markList1(input: string): string {
    console.log("Editing List 1:", input)
    const marker = config.format.list.first ?? `–`;
    return input.replace(/^([-*])\s/g, `${marker} `);
}

function markList2(input: string): string {
    console.log("Editing List 2:", input)
    const marker = config.format.list.second ?? `–`;
    return input
        .replace(/^\s+([-*])\s/g, `${marker} `);
}