/**
 * Locale file, which at present holds only english strings, which are used in the client.
 * Locale shall be used through out the application, wherever strings are hardcoded.
 * Concept is to keep a simple framework, which shall take care of the hardcoding inside each templates / viewes/script files.
 */

const container = {};

const strings = {};

/**
 * String details for head, which could contain meta information.
 */

//#region String literals for default pages.

strings.head_title_default = 'iMeshConnect'; // Head title, this could be used from different places.
strings.head_description_default = 'iMeshConnect Home Page';
strings.head_keywords_default = '';
strings.home_page = "Home";
strings.product_page = "Products";
strings.services_page = "Services";
strings.about_us = "About us";
strings.contact_us = "Contact us";
//#endregion

//#region Literals related to contact page
strings.contact_title = 'iMeshConnect - Contact us';
strings.contact_subtitle = 'This page is used for internal use only. ';
strings.contact_thanks = "Thanks for showing interest. We shall get back to you soon.";
strings.contact_display = "none";

strings.footer_rights = "Copyright 2019 iMeshConnect Solutions Private Ltd. All rights reserved";

//#endregion

container.strings = strings;
module.exports = container;