const path = require( 'path' );
const projectRoot = path.dirname( path.dirname( path.dirname( __dirname ) ) );
const associations = require( `${ projectRoot }/models/announcement/operation/associations` );
const languageSettings = require( `${ projectRoot }/settings/language/config` );

function isLangExist ( data, language ) {
    for ( let i = 0; i < data.length; i++ ) {
        if ( data[ i ].language === language )
            return true;
    }
    return false;
}

module.exports = async ( { language = languageSettings.default, announcementData, } = {} ) => {
    const table = await associations();

    languageSettings.support.forEach( ( lang ) => {
        if ( !isLangExist( announcementData.announcementI18n, lang ) )
            throw `Missing language for announcementI18n: ${ lang }`;

        announcementData.announcementFile.forEach( ( file ) => {
            if ( !isLangExist( file.announcementFileI18n, lang ) )
                throw `Missing language for announcementFileI18n: ${ lang }`;
        } );
    } );

    const data = await table.announcement.create( announcementData, {
        include: [
            {
                model:   table.announcementI18n,
                as:      'announcementI18n',
            },
            {
                model:   table.announcementTag,
                as:      'announcementTag',
            },
            {
                model:   table.announcementFile,
                as:      'announcementFile',
                include: [
                    {
                        model: table.announcementFileI18n,
                        as:    'announcementFileI18n',
                    },
                ],
            },
        ],
    } )
    .then(
        announcement => ( {
            id:          announcement.announcementId,
            title:       announcement.announcementI18n[ 0 ].title,
            content:     announcement.announcementI18n[ 0 ].content,
            author:      announcement.author,
            publishTime: announcement.publishTime,
            updateTime:  announcement.updateTime,
            views:       announcement.views,
            isPinned:    announcement.isPinned,
            files:       announcement.announcementFile.map(
                announcementFile => ( {
                    uploadTime: announcementFile.uploadTime,
                    type:       announcementFile.type,
                    url:        announcementFile.announcementFileI18n[ 0 ].url,
                    name:       announcementFile.announcementFileI18n[ 0 ].name,
                } ),
            ),
            tags:        announcement.announcementTag.map(
                announcementTag => ( {
                    id:   announcementTag.tagId,
                } )
            ),
        } )
    );

    table.database.close();

    return data;
};
