import React from "react";
import "./Header.css"
import '../UsgsCommons.css'
import '../UsgsCustom.css'

const ENV = process.env.REACT_APP_ENV

class Header extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            title: props.title,
            showDescription: false,
            infoToolTip: false,
            showBetaBanner: false,
            betaBannerText: 'Beta'
        }
    }

    // display the beta banner for non production deploys
    componentDidMount() {
        if (ENV && ENV !== 'prod') {
            this.setState({
                showBetaBanner: true,
                betaBannerText: ENV
            })
        }
    }

    render() {
        return (
            // <!-- BEGIN USGS Applications Header Template -->
            <header id="navbar" class="header-nav"  role="banner">
                {this.state.showBetaBanner && <span className="beta-banner">
                    <span className="beta-banner-text">{this.state.betaBannerText}</span>
                </span>
                }
                <div class="tmp-container">
                {/* <!-- primary navigation bar --> */}
                    <div class="header-search">
                        <a class="logo-header" href="https://www.usgs.gov/" title="Home">
                            <img class="img"  src={require('../images/logo.png')}  alt="Home" />
                        </a>
                    </div>
                </div> 
            </header>
            // <!-- END USGS Applications Header Template -->
        );
    }
}
export default Header;
