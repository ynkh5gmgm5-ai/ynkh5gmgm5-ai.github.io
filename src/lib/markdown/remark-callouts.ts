import type { Blockquote, Paragraph, Root, Text } from 'mdast';
import { visit } from 'unist-util-visit';

const labels: Record<string, string> = {
  note: '注意',
  info: '信息',
  tip: '提示',
  success: '成功',
  question: '问题',
  warning: '警告',
  failure: '失败',
  danger: '危险',
  bug: '问题',
  example: '示例',
  quote: '引用',
};

export default function remarkCallouts() {
  return (tree: Root) => {
    visit(tree, 'blockquote', (node: Blockquote) => {
      const first = node.children[0];
      if (!first || first.type !== 'paragraph') return;

      const paragraph = first as Paragraph;
      const marker = paragraph.children[0];
      if (!marker || marker.type !== 'text') return;

      const match = (marker as Text).value.match(/^\[!([a-z-]+)\][+-]?\s*(.*)$/i);
      if (!match) return;

      const type = match[1].toLowerCase();
      const title = match[2].trim() || labels[type] || '提示';
      paragraph.children.splice(0, 1, {
        type: 'strong',
        children: [{ type: 'text', value: title }],
      });

      node.data = {
        ...node.data,
        hName: 'aside',
        hProperties: {
          className: ['callout', `callout-${type}`],
          'data-callout': type,
        },
      };
    });
  };
}
