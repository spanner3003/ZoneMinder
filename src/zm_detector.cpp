#include "zm_detector.h"
#include "zm_logger.h"

Detector::Detector() {

  m_sDetectionCause = DEFAULT_DETECTION_CAUSE;
  m_fMinAlarmScore = DEFAULT_MIN_ALARM_SCORE;
  m_fMaxAlarmScore = DEFAULT_MAX_ALARM_SCORE;
  m_fImageScaleFactor = DEFAULT_IMAGE_SCALE_FACTOR;
  m_sConfigSectionName = DEFAULT_CONFIGFILE_SECTION;
  m_nNewWidth = 0;
  m_nNewHeight = 0;
}

Detector::Detector(string sPluginFileName) {

  char* szPluginFileName = strdup(sPluginFileName.c_str());

  string sPluginFileNameName = string(basename(szPluginFileName));

  size_t idx = sPluginFileNameName.rfind('.');

  if (idx == string::npos)
    m_sConfigSectionName = sPluginFileNameName;
  else
    m_sConfigSectionName = sPluginFileNameName.substr(0, idx);

  m_sDetectionCause = DEFAULT_DETECTION_CAUSE;
  m_fMinAlarmScore = DEFAULT_MIN_ALARM_SCORE;
  m_fMaxAlarmScore = DEFAULT_MAX_ALARM_SCORE;
  m_fImageScaleFactor = DEFAULT_IMAGE_SCALE_FACTOR;
  m_nNewWidth = 0;
  m_nNewHeight = 0;
}

/*!\fn Detector::Detector(const Detector& source)
 * \param source is the object to copy
 */
Detector::Detector(const Detector& source)
  : m_sDetectionCause(source.m_sDetectionCause),
  m_fMinAlarmScore(source.m_fMinAlarmScore),     
  m_fMaxAlarmScore(source.m_fMaxAlarmScore),
  m_fImageScaleFactor(source.m_fImageScaleFactor),
  m_nNewWidth(source.m_nNewWidth),
  m_nNewHeight(source.m_nNewHeight),
  m_sConfigSectionName(source.m_sConfigSectionName)
{
}

/*!\fn Detector& ImageAnalyser::Detector::operator=(const ImageAnalyser::Detector& source)
 * \param source is the object to copy
 */
Detector& Detector::operator=(const Detector& source) {
  m_sDetectionCause = source.m_sDetectionCause;
  m_fMinAlarmScore = source.m_fMinAlarmScore; 
  m_fMaxAlarmScore = source.m_fMaxAlarmScore;
  m_fImageScaleFactor = source.m_fImageScaleFactor;
  m_nNewWidth = source.m_nNewWidth;
  m_nNewHeight = source.m_nNewHeight;
  m_sConfigSectionName = source.m_sConfigSectionName;

  return *this;
}

/*!\fn Detector::getDetectionCause()
 * return detection cause as string
 */
string Detector::getDetectionCause() {
  return m_sDetectionCause;
}

//Detector::~Detector() {}

/*! \fn int FaceDetectorPlugin::Detect(const Image &image, Event::StringSet &zoneSet)
 *  \param image is an image to detect faces on
 *  \param zoneSet is set of zone names (see zm_zone.h)
 *  \return detection score
 */
int Detector::Detect(const Image &zmImage, Zone** zones, int n_numZones, Event::StringSet &zoneSet) {
  bool alarm = false;
  char szMessage[50];
  unsigned int score = 0;

  if (n_numZones <= 0) return (alarm);

  //    // Blank out all exclusion zones
  //    for ( int n_zone = 0; n_zone < n_zones; n_zone++ )
  //    {
  //        Zone *zone = zones[n_zone];
  //        zone->ClearAlarm();
  //        if ( !zone->IsInactive() )
  //        {
  //            continue;
  //        }
  //        Debug( 3, "Blanking inactive zone %s", zone->Label() );
  //        delta_image->Fill( RGB_BLACK, zone->GetPolygon() );
  //    }

  // Check preclusive zones first 
  for (int n_zone = 0; n_zone < n_numZones; n_zone++) {
    Zone *zone = zones[n_zone];
    if (!zone->IsPreclusive()) {
      continue;
    }
    sprintf(szMessage, "Checking preclusive zone %s", zone->Label());
    Debug(3, szMessage);
    if (checkZone(zone, &zmImage)) {
      alarm = true;
      score += zone->Score();
      zone->SetAlarm();
      sprintf(szMessage, "Zone is alarmed, zone score = %d", zone->Score());
      Debug(3, szMessage);
      zoneSet.insert(zone->Label());
    }
  }

  if ( alarm ) {
    alarm = false;
    score = 0;
  } else {
    // Find all alarm pixels in active zones
    for (int n_zone = 0; n_zone < n_numZones; n_zone++) {
      Zone *zone = zones[n_zone];
      if (!zone->IsActive()) {
        continue;
      }
      sprintf(szMessage, "Checking active zone %s", zone->Label());
      Debug(3, szMessage);
      if ( checkZone(zone, &zmImage) ) {
        alarm = true;
        score += zone->Score();
        zone->SetAlarm();
        sprintf(szMessage, "Zone is alarmed, zone score = %d", zone->Score());
        Debug(3, szMessage);
        zoneSet.insert(zone->Label());
      }
    } // end foreach zone

    if ( alarm ) {
      // Checking inclusive zones
      for (int n_zone = 0; n_zone < n_numZones; n_zone++) {
        Zone *zone = zones[n_zone];
        if ( !zone->IsInclusive() ) {
          continue;
        }
        sprintf(szMessage, "Checking inclusive zone %s", zone->Label());
        Debug(3, szMessage);
        if ( checkZone(zone, &zmImage) ) {
          alarm = true;
          score += zone->Score();
          zone->SetAlarm();
          sprintf(szMessage, "Zone is alarmed, zone score = %d", zone->Score());
          Debug(3, szMessage);
          zoneSet.insert(zone->Label());
        }
      } // end foreach zone
    } else {
      // Find all alarm pixels in exclusive zones
      for (int n_zone = 0; n_zone < n_numZones; n_zone++) {
        Zone *zone = zones[n_zone];
        if (!zone->IsExclusive()) {
          continue;
        }
        sprintf(szMessage, "Checking exclusive zone %s", zone->Label());
        Debug(3, szMessage);
        if ( checkZone(zone, &zmImage) ) {
          alarm = true;
          score += zone->Score();
          zone->SetAlarm();
          sprintf(szMessage, "Zone is alarmed, zone score = %d", zone->Score());
          Debug(3, szMessage);
          zoneSet.insert(zone->Label());
        }
      } // end foreach zone
    } //else if(alarm) : exclusive
  } //else if(alarm)

  return score?score:alarm;
} // end int Detector::Detect(const Image &zmImage, Zone** zones, int n_numZones, Event::StringSet &zoneSet)
