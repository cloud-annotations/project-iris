import { validateCookies, handleErrors } from 'Utils'

// This let's us loop through the collection easily.
/**
  LabelList = [Label, Label, ...]

  Collection = {
    Label: [PointerToImage, PointerToImage, ...]
    Label: [PointerToImage, PointerToImage, ...]
    Label: [PointerToImage, PointerToImage, ...]
    Label: [PointerToImage, PointerToImage, ...]
    Label: [PointerToImage, PointerToImage, ...]
  }
*/

export default (endpoint, bucket) => {
  const UNLABELED = 'Unlabeled'
  const ANNOTATIONS_FILE = '_annotations.csv'
  const LABELS_FILE = '_labels.csv'
  const IMAGE_REGEX = /.(jpg|jpeg|png)$/i

  const baseUrl = `/api/proxy/${endpoint}/${bucket}`

  const fetchFileList = () => {
    return fetch(baseUrl)
      .then(handleErrors)
      .then(response => response.text())
      .then(str => new window.DOMParser().parseFromString(str, 'text/xml'))
      .then(data =>
        Array.prototype.map.call(
          data.getElementsByTagName('Contents'),
          element => element.getElementsByTagName('Key')[0].innerHTML
        )
      )
  }

  const populateLabels = fileList => {
    if (
      !fileList.includes(ANNOTATIONS_FILE) ||
      !fileList.includes(LABELS_FILE)
    ) {
      return fileList
    }

    const labels = fetch(`${baseUrl}/${LABELS_FILE}`)
      .then(handleErrors)
      .then(response => response.text())

    const annotations = fetch(`${baseUrl}/${ANNOTATIONS_FILE}`)
      .then(handleErrors)
      .then(response => response.text())

    return Promise.all([labels, annotations]).then(values => {
      const [labelsCsv, annotationsCsv] = values

      let collection = { Unlabeled: [] }
      let labels = [UNLABELED]
      let urls = new Set([])

      // Populate labels.
      labelsCsv.split('\n').forEach(label => {
        label = label.trim()
        // Skip empty lines.
        if (label !== '') {
          labels = [...labels, label]
          collection[label] = []
        }
      })

      // Add listed urls to labels.
      annotationsCsv.split('\n').forEach(annotation => {
        // Skip empty lines.
        if (annotation !== '') {
          const [url, label] = annotation.split(',')
          const trimedLabel = label.trim()
          if (trimedLabel in collection) {
            collection[trimedLabel] = [url, ...collection[trimedLabel]]
            urls.add(url)
          }
        }
      })

      return {
        fileList: fileList,
        collection: collection,
        labels: labels,
        urls: urls
      }
    })
  }

  const populateUnlabeled = res => {
    let { fileList, collection, labels, urls } = res

    // Make sure the extension is an image.
    const imageList = fileList.filter(fileName => fileName.match(IMAGE_REGEX))

    // Add images that weren't listed in our annotations file.
    imageList.forEach(item => {
      if (!urls.has(item)) {
        collection[UNLABELED] = [...collection[UNLABELED], item]
      }
    })

    return { collection: collection, labelList: labels }
  }

  return validateCookies()
    .then(fetchFileList)
    .then(populateLabels)
    .then(populateUnlabeled)
}