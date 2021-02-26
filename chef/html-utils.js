import cheerio from 'https://dev.jspm.io/npm:cheerio@1.0.0-rc.3/index.js';

import { removeSpaces, removeNewlines } from './utils.js';

export function convertTable($, table) {
  const c = cheerio.load('', { _useHtmlParser2: true });
  const rows = table.find('tr:has(td)').get();

  const tbody = c('<tbody></tbody>');
  rows.forEach((tr) => {
    const newTR = c('<tr></tr>');

    $(tr)
      .find('td')
      .get()
      .forEach((td) => {
        const $td = $(td);
        const text = removeSpaces(removeNewlines($td.text()));
        const bg = $td.css('BACKGROUND');
        const newTD = c(bg === '#32c832' || bg === '#009900' ? '<th></th>' : '<td></td>');

        if ($td.attr('colspan')) {
          newTD.attr('colspan', $td.attr('colspan'));
        }

        if ($td.attr('rowspan')) {
          newTD.attr('rowspan', $td.attr('rowspan'));
        }

        newTD.text(text);
        newTR.append(newTD);
      });

    tbody.append(newTR);
  });

  const result = c('<table></table>');
  result.append(tbody);

  const wrapper = c('<div></div>');
  wrapper.append(result);

  return wrapper.html();
}
