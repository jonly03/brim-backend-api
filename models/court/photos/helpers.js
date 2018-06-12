const Nightmare = require('nightmare');

// nightmare.js configuration
const nightmare = Nightmare({ show: true, height: 10000 });
let containerToScroll = process.env.CONSOLE_SCROLLED_CONTAINER;

function getCourtPhotosDetails(){
	// Get courts from cloud
	// Every court's public_id is formatted like this
	// courtName__courtId (for now, moving forward when users upload court photos, add the userId)
	// For now just get everything but going forward (when users upload court photos, search for recent uploads)
	return nightmare
	  .goto(process.env.CONSOLE)
	  .wait(process.env.CONSOLE_EMAIL_SELECTOR)
	  .type(process.env.CONSOLE_EMAIL_SELECTOR, process.env.CONSOLE_EMAIL)
	  .type(process.env.CONSOLE_PASSWORD_SELECTOR, process.env.CONSOLE_PASSWORD)
	  .click(process.env.CONSOLE_SUBMIT_SELECTOR)
	  .wait(process.env.CONSOLE_COURT_PHOTOS_CONTAINER_SELECTOR)
	  .evaluate((containerToScroll) => {
	    document.querySelector(containerToScroll).scrollTop = 1000000
	  }, containerToScroll)
	  .wait(2000)
	  .evaluate((containerToScroll) => {
	    document.querySelector(containerToScroll).scrollTop = 1000000
	  }, containerToScroll)
	  .wait(2000)
	  .evaluate((containerToScroll) => {
	    document.querySelector(containerToScroll).scrollTop = 1000000
	  }, containerToScroll)
	  .wait(2000)
	  .evaluate((containerToScroll) => {
	    document.querySelector(containerToScroll).scrollTop = 1000000
	  }, containerToScroll)
	  .wait(2000)
	  .evaluate((containerToScroll) => {
	    document.querySelector(containerToScroll).scrollTop = 1000000
	  }, containerToScroll)
	  .wait(2000)
	  .evaluate((containerToScroll) => {
	    document.querySelector(containerToScroll).scrollTop = 1000000
	  }, containerToScroll)
	  .wait(2000)
	  .evaluate(() => document.body.innerHTML)
}

function parseCourtPhotos($){
    let public_ids = $('article').find('div.textbox');
    let sizes = $('article').find("div[data-test='asset-dimensions']");
    console.log(sizes.length);

    let images = [];

    for (let i=0; i < sizes.length; i++){
      let public_id = $(public_ids[i]).attr('data-balloon');

      if (public_id){
        let wxh = $(sizes[i]).text();
        let width = wxh.split(' ')[0].trim();
        let height = wxh.split(' ')[2].trim();
        
        let header = public_id.split('__')[0];
        
        if (header === 'Unsplash'){
          let _id = public_id.split('__')[1];
          let username = public_id.split('__')[2];
          let photographer = public_id.split('__')[3].split('.')[0];
          
          images.push({
            url_root: process.env.COURT_PHOTOS_HOST_URL,
            public_id,
            _id,
            username,
            photographer,
            width,
            height
          })
        } else{
          // public_id is court_name_name__courtId__uniquId
          let court_name = public_id.split('__')[0];
          let court_id = public_id.split('__')[1].split('.')[0];
          
          images.push({
            url_root: process.env.COURT_PHOTOS_HOST_URL,
            public_id,
            court_name,
            court_id,
            width,
            height,
            likes: 0
          })
        }
      }
    }

    return images;
}

module.exports = {
    getCourtPhotosDetails,
    parseCourtPhotos
}