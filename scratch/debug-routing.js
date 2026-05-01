const { getAllContent } = require('./src/lib/content');

async function test() {
  const content = await getAllContent();
  const item = content.find(i => i.slug === 'install-chat-widget');
  console.log(JSON.stringify(item, null, 2));
}

test();
