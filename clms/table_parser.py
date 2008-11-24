# See license file (LICENSE.txt) for info about license terms.

import string
import libxml2dom

class TableParser(object):
    def __init__(self):
        self.num_tokens = 0

    def run(self,html):
        doc = libxml2dom.parseString(html, html=1)
        doc_table = doc.getElementsByTagName('table')
        ##try:
        doc_table = doc_table[0]
        self.tds_width = self._some_has_width(doc.getElementsByTagName('td'))
        self.ths_width = self._some_has_width(doc.getElementsByTagName('th'))

        doc_table = self.parse_table(doc_table)

        doc_table = self.set_size_table(doc_table)
        doc_str = doc_table.toString()
        doc_str_lt = doc_str.replace('&lt;','<')
        doc_str_gt = doc_str_lt.replace('&gt;','>')

        return doc_str_gt
        #except:
            #pass
        return html

    def parse_table(self,doc_table):
        for table_child in doc_table.childNodes:
            if table_child.tagName == 'thead':
                self.parse_thead(table_child)
            elif table_child.tagName == 'tbody':
                self.parse_tbody(table_child)
            elif table_child.tagName == 'tfoot':
                self.parse_tfoot(table_child)
            elif table_child.tagName == 'tr':
                self.parse_tr(table_child)
            else:
                doc_table.removeChild(table_child)
        return doc_table

    def parse_thead(self,thead):
        return self.parse_tbody(thead)

    def parse_tfoot(self,tfoot):
        return self.parse_tbody(tfoot)

    def parse_tbody(self,tbody):
        for tbody_child in tbody.childNodes:
            if tbody_child.tagName == 'tr':
                self.parse_tr(tbody_child)
            else:
                tbody.removeChild(tbody_child)
        return tbody

    def parse_tr(self,tr):
        for tr_child in tr.childNodes:
            if tr_child.tagName == 'td':
                self.parse_td(tr_child)
            elif tr_child.tagName == 'thead':
                self.parse_thead(tr_child)
            else:
                tr.removeChild(tr_child)
        return tr

    def parse_th(self,th):
        return self.parse_td(th)


    def parse_td(self,td):
        if td.childNodes:
            for td_child in td.childNodes:
                if td_child.tagName == 'table':
                    self.parse_table(td_child)
                elif td_child.tagName == 'thead':
                    self.parse_thead(td_child)
                elif td_child.tagName == 'tfoot':
                    self.parse_tfoot(td_child)
                elif td_child.tagName == 'tr':
                    self.parse_tr(td_child)
                elif td_child.tagName == None and \
                    not td.getElementsByTagName('table') and \
                    not td.getElementsByTagName('thead') and \
                    not td.getElementsByTagName('tfoot') and \
                    not td.getElementsByTagName('tr'):
                    td_child.value= u'<!-- token%s -->' %(self.num_tokens)
                    self.num_tokens = self.num_tokens + 1

                else:
                    td.removeChild(td_child)
        else:
            token_node = td.createTextNode(u'<!-- token%s -->' %(self.num_tokens))
            td.appendChild(token_node)
            td.setAttribute('style','position:relative')
            self.num_tokens = self.num_tokens + 1
        return td

    def set_size_table(self,doc_table):
        for table_child in doc_table.childNodes:
            if table_child.tagName == 'thead':
                self.set_size_table(table_child)
            elif table_child.tagName == 'tbody':
                self.set_size_table(table_child)
            elif table_child.tagName == 'tfoot':
                self.set_size_table(table_child)
            elif table_child.tagName == 'tr':
                trs = self._getElementsByTagNameAndChildNode(doc_table, 'tr')
                porcent = "%s%%" %(100/self._get_num_cols(trs))
                self._set_attrs_in_list_per_cent(trs, 'height', porcent)
                self.set_size_tr(table_child)
        return doc_table

    def set_size_thead(self,thead):
        return self.set_size_tbody(thead)

    def set_size_tfoot(self,tfoot):
        return self.set_size_tbody(tfoot)

    def set_size_tbody(self,tbody):
        for tbody_child in tbody.childNodes:
            if tbody_child.tagName == 'tr':
                self.set_size_tr(tbody_child)
        return tbody

    def set_size_tr(self,tr):
        tds = self._getElementsByTagNameAndChildNode(tr.parentNode.firstChild,'td')
        ths = self._getElementsByTagNameAndChildNode(tr.parentNode.firstChild,'th')

        num_cols = 0

        num_cols+= self._get_num_cols(tds)
        num_cols+= self._get_num_cols(ths)

        porcent = 100/num_cols
        tds = self._getElementsByTagNameAndChildNode(tr,'td')
        ths = self._getElementsByTagNameAndChildNode(tr,'th')

        self._set_width_height_in_cell(tds, tr, not self.tds_width, porcent)
        self._set_width_height_in_cell(ths, tr, not self.ths_width, porcent)

        tables = tr.getElementsByTagName('table')
        for table in tables:
            self.set_size_table(table)
        return tr

    def _getElementsByTagNameAndChildNode(self, tag, child_type):
        l = []
        for child in tag.childNodes:
            if child.tagName == child_type:
                l.append(child)
        return l

    def _get_num_cols(self, tags):
        num_cols = 0
        for tag in tags:
            print tag.toString()
            if (not self._get_in_style(tag,'height') or self._get_in_style(tag,'height').find("%")!=-1) :
                print 'x'
                num_cols+= (self._get_in_style(tag,'colspan') and self._get_in_style(tag,'colspan').isdigit() \
                                                        and int(self._get_in_style(tag,'colspan')) >0 \
                                                        and  int(self._get_in_style(tag,'colspan'))) or 1
        if num_cols == 0 and tags:
            return 1
        else:
            return num_cols

    def _get_style(self, tag):
        return tag.getAttribute("style") and  dict([map(string.strip, u.split(":")) for u in [c.strip() for c in tag.getAttribute("style").split(";")]])

    def _set_attrs_in_list(self, l, attr, value):
        for tag in l:
            self._set_attrs_in_tag(tag, attr, value)

    def _some_has_width(self,tags):

        for tag in tags:
            if self._get_in_style(tag,'width'):
                return True
            else:
                style = self._get_style(tag)
                if style and style.get('width',None):
                    return True
        return False

    def _set_width_height_in_cell(self, tags, tr, calculate_width, porcent):
        for tag in tags:
            if calculate_width:
                colspan = self._get_in_style(tag,'colspan') and self._get_in_style(tag,'colspan').isdigit() \
                                                    and int(self._get_in_style(tag,'colspan')) >0 \
                                                    and  int(self._get_in_style(tag,'colspan')) or 1
                width = "%s%%"%(porcent*colspan)

                self._set_attrs_in_tag(tag, 'width', width)
            self._set_in_style(tag, 'height', self._get_in_style(tr, 'height'))

    def _set_attrs_in_tag(self, tag, attr, value):
        style = self._get_style(tag)
        if not self._get_in_style(tag,attr):
            self._set_in_style(tag, attr,value)

    def _set_attrs_in_list_per_cent(self, tags, attr, value):
        for tag in tags:
            self._set_attrs_in_tag_per_cent(tag, attr, value)

    def _set_attrs_in_tag_per_cent(self, tag, attr, value):
        style = self._get_style(tag)
        property_tag = self._get_in_style(tag, attr)
        if (not  property_tag or property_tag.find("%")!=-1):
            self._set_in_style(tag, attr, value)

    def _get_in_style(self, tag, attr):
        style = self._get_style(tag)
        return style and style.get(attr, None)

    def _set_in_style(self, tag, attr, value):
        style = self._get_style(tag) or {}
        style[attr] = value
        style_unicode = self._convert_dict_unicode(style)
        tag.setAttribute('style', style_unicode)

    def _convert_dict_unicode(self,d):
        d_uni = unicode(d)
        d_uni = d_uni.replace("u'","")
        d_uni = d_uni.replace("'","")
        d_uni = d_uni.replace(",",";")
        d_uni = d_uni.replace("{","")
        d_uni = d_uni.replace("}","")
        return d_uni

