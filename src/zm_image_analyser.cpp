#include "zm_image_analyser.h"

/*!\fn ImageAnalyser::ImageAnalyser(const ImageAnalyser& source)
 * \param source is the object to copy
 */
ImageAnalyser::ImageAnalyser(const ImageAnalyser& source) {
    m_Detectors = source.m_Detectors;
}

/*!\fn ImageAnalyser::operator=(const ImageAnalyser& source)
 * \param source is the object to copy
 */
ImageAnalyser& ImageAnalyser::operator=(const ImageAnalyser& source) {
    m_Detectors = source.m_Detectors;
    return *this;
}

ImageAnalyser::~ImageAnalyser() {
  for(DetectorsList::reverse_iterator it = m_Detectors.rbegin();
      it != m_Detectors.rend();
      ++it)
    delete *it;
}

/*!\fn ImageAnalyser::DoDetection(const Image &comp_image, Zone** zones, int n_numZones, Event::StringSetMap noteSetMap, std::string& det_cause)
 * \param comp_image is the image to analyse
 * \param zones is the zones array to analyse
 * \param n_numZones is the number of zones
 * \param noteSetMap is the map of events descriptions
 * \param det_cause is a string describing detection cause
 */
int ImageAnalyser::DoDetection(const Image &comp_image, Zone** zones, int n_numZones, Event::StringSetMap noteSetMap, std::string& det_cause) {
  Event::StringSet zoneSet;
  int score = 0;

  for(DetectorsList::iterator it = m_Detectors.begin();
      it != m_Detectors.end();
      ++it) {
    int detect_score = (*it)->Detect(comp_image, zones, n_numZones, zoneSet);
    if ( detect_score ) {
      score += detect_score;
      noteSetMap[(*it)->getDetectionCause()] = zoneSet;
      if ( det_cause.length() )
        det_cause += ", ";
      det_cause += (*it)->getDetectionCause();
    }
  }
  return score;
}

/*!\fn ImageAnalyser::configurePlugins(string sConfigFileName)
 *  \param sConfigFileName is the path to the configuration file, where parameters for all plugins are given.
 */
void ImageAnalyser::configurePlugins(string sConfigFileName) {
  for(DetectorsList::iterator it = m_Detectors.begin();
      it != m_Detectors.end();
      ++it) {
    try {
      (*it)->loadConfig(sConfigFileName);
    } catch(...) {
      Info("ERROR: Plugin \"%s\" couldn\'t load config file \"%s\".", (*it)->getDetectionCause(), sConfigFileName.c_str());
    }
  }
}
