const fs = require('fs');
let content = fs.readFileSync('src/components/chat/JarvisChat.tsx', 'utf8');

// Increase width and add huge padding
content = content.replace('sm:w-[500px]', 'sm:w-[560px]');
content = content.replace('px-8 py-6', 'px-12 py-10');
content = content.replace('px-8 pb-8 pt-2', 'px-12 pb-12 pt-6');
content = content.replace('p-8 bg-[#020202]', 'p-12 bg-[#020202]');
content = content.replace('mt-8', 'mt-12'); // Replace multiple times if needed, wait, let's do a global replace for mt-8 to mt-12 in bubbles
content = content.replace(/mt-8/g, 'mt-12');

// Fix the input arrow
content = content.replace('gap-4', 'gap-6');

fs.writeFileSync('src/components/chat/JarvisChat.tsx', content);
