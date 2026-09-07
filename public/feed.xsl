<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
  <xsl:output method="html" encoding="UTF-8"/>
  <xsl:template match="/">
    <html lang="zh"><head><meta name="viewport" content="width=device-width, initial-scale=1"/><title><xsl:value-of select="rss/channel/title"/> · RSS</title><style>body{font:16px/1.8 system-ui,sans-serif;max-width:760px;margin:40px auto;padding:0 22px;color:#303b42;background:#f6f8f9}a{color:#277b83}article{border-top:1px solid #d5dfe0;padding:18px 0}h2{font-size:20px}time{font-size:12px;color:#697a82}</style></head><body>
      <h1><xsl:value-of select="rss/channel/title"/> · RSS</h1><p><xsl:value-of select="rss/channel/description"/></p>
      <xsl:for-each select="rss/channel/item"><article><time><xsl:value-of select="pubDate"/></time><h2><a href="{link}"><xsl:value-of select="title"/></a></h2><p><xsl:value-of select="description"/></p></article></xsl:for-each>
    </body></html>
  </xsl:template>
</xsl:stylesheet>
