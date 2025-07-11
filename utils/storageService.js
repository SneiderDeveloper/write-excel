const { Storage } = require('@google-cloud/storage')

let myBucket

const initializeStorage = () => {
	//   const storage = new Storage({
	//     projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
	//     keyFilename: process.env.GOOGLE_CLOUD_KEYFILE_PATH,
	//   });

  const storage = new Storage({
    projectId: 'briefcase-a80cf',
    keyFilename: './keyfile.json'
	});

	myBucket = storage.bucket('briefcase-a80cf.appspot.com');

  return myBucket;
}

const getBucket = () => {
	if (!myBucket) {
		myBucket = initializeStorage();
	}
	return myBucket;
}

module.exports = { initializeStorage, getBucket }