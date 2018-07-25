#ifndef ZM_DETECTOR_H
#define ZM_DETECTOR_H

#include <string>
#include <syslog.h>
#include <libgen.h>

#include "zm_image.h"
#include "zm_zone.h"
#include "zm_event.h"

#define DEFAULT_DETECTION_CAUSE "Object Detected"
#define DEFAULT_MIN_ALARM_SCORE 1.0
#define DEFAULT_MAX_ALARM_SCORE 99.0
#define DEFAULT_IMAGE_SCALE_FACTOR 1.0

#define DEFAULT_LOG_PREFIX "ZM PLUGIN"
#define LOG_LEVEL LOG_NOTICE
#define DEFAULT_CONFIGFILE_SECTION "libzm_vscvl_plugin"

using namespace std;

//! Base class for object detectors, defined in plugins.
class Detector {

  public:

    //! Destructor
    virtual ~Detector() { closelog(); }

    //! Default constructor
    Detector();
    //! Constructor with section name parameter.
    Detector(string sPluginFileName);

    //! Copy constructor
    Detector(const Detector& source);

    //! Assignment operator
    Detector& operator=(const Detector& source);

    //! Detect (in an image later)
    int Detect(const Image &image, Zone** zones, int n_numZones, Event::StringSet &zoneSet);

    //! Load detector's parameters from a config file.
    virtual void loadConfig(string sConfigFileName) = 0;

    //! Returns detection case string.
    string getDetectionCause();

  protected:

    //! Do detection inside one given zone.
    virtual bool checkZone(Zone *zone, const Image *zmImage) = 0;

    //! Log messages to the SYSLOG.
    void log(int, string sMessage);

    //! String to be shown as detection cause for event.
    string m_sDetectionCause;

    //! Minimum score value to consider frame as to be alarmed.
    double m_fMinAlarmScore;

    //! Maximum score value to consider frame as to be alarmed.
    double m_fMaxAlarmScore;

    //! Maximum allowed width of frame image.
    double m_fImageScaleFactor;

    //! Width of image to resize.
    int m_nNewWidth;

    //! Height of image to resize.
    int m_nNewHeight;
    //
    //    //! Output stream for logging errors.
    //    ofstream m_outStream;

    //! String prefix for SYSLOG messages.
    string m_sLogPrefix;

    //! Name of config file section to search parameters.
    string m_sConfigSectionName;
};


#endif // ZM_DETECTOR_H
