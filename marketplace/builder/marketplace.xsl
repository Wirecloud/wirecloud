<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="1.0"
xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
<xsl:output omit-xml-declaration="yes" indent="no"  method="text"/>

<xsl:param name="WIDGET" select="'widget'"/>
<xsl:param name="AGILE_DASHBOARDS_VERSION" select="'v0.3'"/>

<xsl:template match="/*">
<xsl:text>
</xsl:text>
<xsl:text>### </xsl:text>
<xsl:value-of select="details/title"/>
<xsl:text>

</xsl:text>
<xsl:value-of select="details/description"/>

* Vendor: <xsl:value-of select="@vendor"/> 
* Version: <xsl:value-of select="@version"/> 
* License: <xsl:value-of select="details/license"/> 

<xsl:if test="details/homepage != ''" >

    <xsl:text>Homepage: [</xsl:text>
    <xsl:value-of select="details/homepage"/>
    <xsl:text>](</xsl:text>
    <xsl:value-of select="details/homepage"/>)
    <xsl:text>**[Download </xsl:text>
    <xsl:call-template name="replace">
        <xsl:with-param name="text" select="substring-after($WIDGET, 'widgets/')"/>
        <xsl:with-param name="search" select="'_'"/>
        <xsl:with-param name="replace" select="'\_'"/>
    </xsl:call-template>](<xsl:value-of select="details/homepage"/>
    <xsl:text>/releases/download/</xsl:text>
    <xsl:choose>
        <xsl:when test="contains(details/homepage, 'agile-dashboards')">
            <xsl:value-of select="$AGILE_DASHBOARDS_VERSION"/>
        </xsl:when>
        <xsl:otherwise>
            <xsl:value-of select="@version"/>
        </xsl:otherwise>
    </xsl:choose>
    <xsl:text>/</xsl:text>
    <xsl:value-of select="substring-after($WIDGET, 'widgets/')"/>
    <xsl:text>)**</xsl:text>
</xsl:if>


<xsl:text>
</xsl:text>
</xsl:template>


<xsl:template name="replace">
    <xsl:param name="text"/>
    <xsl:param name="search"/>
    <xsl:param name="replace"/>
    <xsl:choose>
        <xsl:when test="contains($text, $search)">
            <xsl:variable name="replace-next">
                <xsl:call-template name="replace">
                    <xsl:with-param name="text" select="substring-after($text, $search)"/>
                    <xsl:with-param name="search" select="$search"/>
                    <xsl:with-param name="replace" select="$replace"/>
                </xsl:call-template>
            </xsl:variable>
            <xsl:value-of 
                select="
                    concat(
                        substring-before($text, $search)
                    ,   $replace
                    ,   $replace-next
                    )
                "
            />
        </xsl:when>
        <xsl:otherwise><xsl:value-of select="$text"/></xsl:otherwise>
    </xsl:choose>
</xsl:template>

</xsl:stylesheet>

