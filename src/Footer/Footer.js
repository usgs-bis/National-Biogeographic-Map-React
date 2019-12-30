import React from 'react';
import './Footer.css';
import '../UsgsCommons.css';
import '../UsgsCustom.css';

class Footer extends React.Component {
  render() {
    return (
      <>
      {/* <!-- BEGIN USGS Footer Template --> */}
      <footer class="footer">
        {/* <!-- .footer-wrap --> */}
        <div class="tmp-container">
          {/* <!-- .footer-doi --> */}
          <div class="footer-doi">
            {/* <!-- footer nav links --> */}
            <ul class="menu nav">
              <li class="first leaf menu-links menu-level-1"><a href="https://www.doi.gov/privacy">DOI Privacy Policy</a></li>
              <li class="leaf menu-links menu-level-1"><a href="https://www.usgs.gov/laws/policies_notices.html">Legal</a></li>
              <li class="leaf menu-links menu-level-1"><a href="https://www2.usgs.gov/laws/accessibility.html">Accessibility</a></li>
              <li class="leaf menu-links menu-level-1"><a href="https://www.usgs.gov/sitemap.html">Site Map</a></li>
              <li class="last leaf menu-links menu-level-1"><a href="https://answers.usgs.gov/">Contact USGS</a></li>
            </ul>
            {/* <!--/ footer nav links -->       */}
          </div>
          {/* <!-- /.footer-doi --> */}

          <hr/>

          {/* <!-- .footer-utl-links --> */}
          <div class="footer-doi">
            <ul class="menu nav">
              <li class="first leaf menu-links menu-level-1"><a href="https://www.doi.gov/">U.S. Department of the Interior</a></li>
              <li class="leaf menu-links menu-level-1"><a href="https://www.doioig.gov/">DOI Inspector General</a></li>
              <li class="leaf menu-links menu-level-1"><a href="https://www.whitehouse.gov/">White House</a></li>
              <li class="leaf menu-links menu-level-1"><a href="https://www.whitehouse.gov/omb/management/egov/">E-gov</a></li>
              <li class="leaf menu-links menu-level-1"><a href="https://www.doi.gov/pmb/eeo/no-fear-act">No Fear Act</a></li>
              <li class="last leaf menu-links menu-level-1"><a href="https://www2.usgs.gov/foia">FOIA</a></li>
            </ul>
            </div>			
          {/* <!-- /.footer-utl-links --> */}
        </div>
        {/* <!-- /.footer-wrap -->	 */}
      </footer>
      {/* <!-- END USGS Footer Template- --> */}
      {/* <!-- Google Tag Manager (noscript) --> */}
      <noscript><iframe src="https://www.googletagmanager.com/ns.html?id=GTM-TKQR8KP"
      height="0" width="0" style={{display:'none',visibility:'hidden'}} title="gtm"></iframe></noscript>
      {/* <!-- End Google Tag Manager (noscript) --> */}
      </>
    )
  }
}

export default Footer;