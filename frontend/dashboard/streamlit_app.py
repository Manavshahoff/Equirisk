import requests
import streamlit as st
import pandas as pd


API_BASE_URL = "http://127.0.0.1:8000"


st.set_page_config(
    page_title="EquiRisk Dashboard",
    page_icon="📈",
    layout="wide",
)


st.title("EquiRisk")
st.subheader("Equity Options Pricing and Risk Dashboard")

tab1, tab2, tab3 = st.tabs(
    ["Single Trade Pricing", "Portfolio Risk", "Scenario Risk"]
)


# -----------------------------
# TAB 1: SINGLE TRADE PRICING
# -----------------------------
with tab1:
    st.write("Price one European option and view trade-level Greeks.")

    with st.sidebar:
        st.header("Single Trade Input")

        trade_id = st.text_input("Trade ID", value="T001")
        book = st.text_input("Book", value="EQD")
        symbol = st.text_input("Symbol", value="AAPL")

        product_type = st.selectbox(
            "Product Type",
            ["european_option"],
        )

        option_type = st.selectbox(
            "Option Type",
            ["call", "put"],
        )

        quantity = st.number_input(
            "Quantity",
            min_value=-100000,
            max_value=100000,
            value=100,
            step=1,
        )

        strike = st.number_input(
            "Strike",
            min_value=0.01,
            value=105.0,
            step=1.0,
        )

        expiry = st.date_input("Expiry Date")

        pricing_model = st.selectbox(
            "Pricing Model",
            ["black_scholes"],
        )

        st.header("Market Data")

        spot = st.number_input(
            "Spot Price",
            min_value=0.01,
            value=100.0,
            step=1.0,
        )

        rate = st.number_input(
            "Risk-Free Rate",
            min_value=-1.0,
            max_value=1.0,
            value=0.05,
            step=0.01,
            format="%.4f",
        )

        volatility = st.number_input(
            "Volatility",
            min_value=0.0,
            max_value=5.0,
            value=0.20,
            step=0.01,
            format="%.4f",
        )

        as_of_date = st.date_input("As-of Date")

        run_button = st.button("Run Single Trade Pricing")

    if run_button:
        payload = {
            "trade_id": trade_id,
            "book": book,
            "symbol": symbol,
            "product_type": product_type,
            "option_type": option_type,
            "quantity": quantity,
            "strike": strike,
            "expiry": str(expiry),
            "pricing_model": pricing_model,
            "spot": spot,
            "rate": rate,
            "volatility": volatility,
            "as_of_date": str(as_of_date),
        }

        try:
            response = requests.post(
                f"{API_BASE_URL}/pricing/price-trade",
                json=payload,
                timeout=10,
            )

            if response.status_code == 200:
                result = response.json()

                st.success("Pricing completed successfully.")

                col1, col2, col3 = st.columns(3)

                with col1:
                    st.metric("Unit Price", f"{result['unit_price']:.4f}")
                    st.metric("Market Value", f"{result['market_value']:.4f}")

                with col2:
                    st.metric("Delta", f"{result['delta']:.4f}")
                    st.metric("Gamma", f"{result['gamma']:.4f}")

                with col3:
                    st.metric("Vega", f"{result['vega']:.4f}")
                    st.metric("Theta", f"{result['theta']:.4f}")
                    st.metric("Rho", f"{result['rho']:.4f}")

                st.subheader("Full Result")
                st.json(result)

            else:
                st.error("API returned an error.")
                st.write(response.json())

        except requests.exceptions.ConnectionError:
            st.error("Could not connect to FastAPI. Make sure backend is running.")

        except Exception as error:
            st.error(f"Unexpected error: {error}")


# -----------------------------
# TAB 2: PORTFOLIO RISK
# -----------------------------
with tab2:
    st.write("Run portfolio-level pricing and aggregate Greeks.")

    st.subheader("Portfolio Trades")

    uploaded_trades_file = st.file_uploader(
        "Upload trades CSV",
        type=["csv"],
        key="portfolio_trades_upload",
    )

    if uploaded_trades_file is not None:
        default_trades = pd.read_csv(uploaded_trades_file)
    else:

        default_trades = pd.DataFrame(
            [
                {
                    "trade_id": "T001",
                    "book": "EQD",
                    "symbol": "AAPL",
                    "product_type": "european_option",
                    "option_type": "call",
                    "quantity": 100,
                    "strike": 105,
                    "expiry": "2027-05-20",
                    "pricing_model": "black_scholes",
                },
                {
                    "trade_id": "T002",
                    "book": "EQD",
                    "symbol": "AAPL",
                    "product_type": "european_option",
                    "option_type": "put",
                    "quantity": 50,
                    "strike": 95,
                    "expiry": "2027-05-20",
                    "pricing_model": "black_scholes",
                },
                {
                    "trade_id": "T003",
                    "book": "EQD",
                    "symbol": "MSFT",
                    "product_type": "european_option",
                    "option_type": "call",
                    "quantity": 75,
                    "strike": 420,
                    "expiry": "2027-05-20",
                    "pricing_model": "black_scholes",
                },
            ]
        )

    edited_trades = st.data_editor(
        default_trades,
        num_rows="dynamic",
        use_container_width=True,
    )

    st.subheader("Market Data")
    uploaded_market_data_file = st.file_uploader(
    "Upload market data CSV",
    type=["csv"],
    key="portfolio_market_data_upload",
    )

    if uploaded_market_data_file is not None:
        default_market_data = pd.read_csv(uploaded_market_data_file)
    else:

        default_market_data = pd.DataFrame(
            [
                {
                    "symbol": "AAPL",
                    "spot": 100,
                    "rate": 0.05,
                    "volatility": 0.20,
                    "as_of_date": "2026-05-20",
                },
                {
                    "symbol": "MSFT",
                    "spot": 410,
                    "rate": 0.05,
                    "volatility": 0.25,
                    "as_of_date": "2026-05-20",
                },
            ]
        )

    edited_market_data = st.data_editor(
        default_market_data,
        num_rows="dynamic",
        use_container_width=True,
    )

    run_portfolio_button = st.button("Run Portfolio Risk")

    if run_portfolio_button:
        payload = {
            "trades": edited_trades.to_dict(orient="records"),
            "market_data": edited_market_data.to_dict(orient="records"),
        }

        try:
            response = requests.post(
                f"{API_BASE_URL}/pricing/run-risk",
                json=payload,
                timeout=10,
            )

            if response.status_code == 200:
                result = response.json()

                st.success("Portfolio risk completed successfully.")

                col1, col2, col3 = st.columns(3)

                with col1:
                    st.metric("Total Trades", result["total_trades"])
                    st.metric("Priced Trades", result["priced_trades"])
                    st.metric("Failed Trades", result["failed_trades"])

                with col2:
                    st.metric(
                        "Total Market Value",
                        f"{result['total_market_value']:.4f}",
                    )
                    st.metric("Total Delta", f"{result['total_delta']:.4f}")
                    st.metric("Total Gamma", f"{result['total_gamma']:.4f}")

                with col3:
                    st.metric("Total Vega", f"{result['total_vega']:.4f}")
                    st.metric("Total Theta", f"{result['total_theta']:.4f}")
                    st.metric("Total Rho", f"{result['total_rho']:.4f}")

                st.subheader("Trade-Level Results")

                trade_results_df = pd.DataFrame(result["trade_results"])
                trade_results_df = trade_results_df.round(4)
                st.dataframe(trade_results_df, use_container_width=True)

                st.subheader("Market Value by Trade")

                market_value_chart = trade_results_df.set_index("trade_id")["market_value"]
                st.bar_chart(market_value_chart)


                st.subheader("Greeks by Trade")

                greeks_columns = ["delta", "gamma", "vega", "theta", "rho"]

                available_greeks = [
                    column for column in greeks_columns if column in trade_results_df.columns
                ]

                selected_greek = st.selectbox(
                    "Select Greek to visualize",
                    available_greeks,
                    key="portfolio_greek_selector",
                )

                greek_chart = trade_results_df.set_index("trade_id")[selected_greek]
                st.bar_chart(greek_chart)

                if result["errors"]:
                    st.subheader("Errors")
                    st.dataframe(pd.DataFrame(result["errors"]), use_container_width=True)

                st.download_button(
                    label="Download Trade Results as CSV",
                    data=trade_results_df.to_csv(index=False),
                    file_name="equirisk_trade_results.csv",
                    mime="text/csv",
                )

            else:
                st.error("API returned an error.")
                st.write(response.json())

        except requests.exceptions.ConnectionError:
            st.error("Could not connect to FastAPI. Make sure backend is running.")

        except Exception as error:
            st.error(f"Unexpected error: {error}")

# -----------------------------
# TAB 3: SCENARIO RISK
# -----------------------------
with tab3:
    st.write("Run scenario shocks and view portfolio PnL impact.")

    st.subheader("Scenario Portfolio Trades")
    uploaded_scenario_trades_file = st.file_uploader(
    "Upload scenario trades CSV",
    type=["csv"],
    key="scenario_trades_upload",
    )

    if uploaded_scenario_trades_file is not None:
        scenario_trades = pd.read_csv(uploaded_scenario_trades_file)
    else:

        scenario_trades = pd.DataFrame(
            [
                {
                    "trade_id": "T001",
                    "book": "EQD",
                    "symbol": "AAPL",
                    "product_type": "european_option",
                    "option_type": "call",
                    "quantity": 100,
                    "strike": 105,
                    "expiry": "2027-05-20",
                    "pricing_model": "black_scholes",
                },
                {
                    "trade_id": "T002",
                    "book": "EQD",
                    "symbol": "AAPL",
                    "product_type": "european_option",
                    "option_type": "put",
                    "quantity": 50,
                    "strike": 95,
                    "expiry": "2027-05-20",
                    "pricing_model": "black_scholes",
                },
                {
                    "trade_id": "T003",
                    "book": "EQD",
                    "symbol": "MSFT",
                    "product_type": "european_option",
                    "option_type": "call",
                    "quantity": 75,
                    "strike": 420,
                    "expiry": "2027-05-20",
                    "pricing_model": "black_scholes",
                },
            ]
        )

    edited_scenario_trades = st.data_editor(
        scenario_trades,
        num_rows="dynamic",
        use_container_width=True,
        key="scenario_trades_editor",
    )

    st.subheader("Scenario Market Data")
    uploaded_scenario_market_data_file = st.file_uploader(
    "Upload scenario market data CSV",
    type=["csv"],
    key="scenario_market_data_upload",
    )

    if uploaded_scenario_market_data_file is not None:
        scenario_market_data = pd.read_csv(uploaded_scenario_market_data_file)
    else:

        scenario_market_data = pd.DataFrame(
            [
                {
                    "symbol": "AAPL",
                    "spot": 100,
                    "rate": 0.05,
                    "volatility": 0.20,
                    "as_of_date": "2026-05-20",
                },
                {
                    "symbol": "MSFT",
                    "spot": 410,
                    "rate": 0.05,
                    "volatility": 0.25,
                    "as_of_date": "2026-05-20",
                },
            ]
        )

    edited_scenario_market_data = st.data_editor(
        scenario_market_data,
        num_rows="dynamic",
        use_container_width=True,
        key="scenario_market_data_editor",
    )

    st.subheader("Scenario Shock Inputs")

    col1, col2, col3, col4 = st.columns(4)

    with col1:
        scenario_name = st.text_input(
            "Scenario Name",
            value="Equity Down 5 Percent",
        )

    with col2:
        spot_shock = st.number_input(
            "Spot Shock",
            value=-0.05,
            step=0.01,
            format="%.4f",
            help="Example: -0.05 means spot decreases by 5%",
        )

    with col3:
        volatility_shock = st.number_input(
            "Volatility Shock",
            value=0.00,
            step=0.01,
            format="%.4f",
            help="Example: 0.10 means volatility increases by 10%",
        )

    with col4:
        rate_shock = st.number_input(
            "Rate Shock",
            value=0.00,
            step=0.01,
            format="%.4f",
            help="Example: 0.01 means rate increases by 1%",
        )

    run_scenario_button = st.button("Run Scenario Risk")

    if run_scenario_button:
        payload = {
            "trades": edited_scenario_trades.to_dict(orient="records"),
            "market_data": edited_scenario_market_data.to_dict(orient="records"),
            "scenario": {
                "name": scenario_name,
                "spot_shock": spot_shock,
                "volatility_shock": volatility_shock,
                "rate_shock": rate_shock,
            },
        }

        try:
            response = requests.post(
                f"{API_BASE_URL}/pricing/scenario-risk",
                json=payload,
                timeout=10,
            )

            if response.status_code == 200:
                result = response.json()

                st.success("Scenario risk completed successfully.")

                col1, col2, col3, col4 = st.columns(4)

                with col1:
                    st.metric("Scenario", result["scenario_name"])

                with col2:
                    st.metric(
                        "Base Portfolio Value",
                        f"{result['base_portfolio_value']:.4f}",
                    )

                with col3:
                    st.metric(
                        "Shocked Portfolio Value",
                        f"{result['shocked_portfolio_value']:.4f}",
                    )

                with col4:
                    st.metric(
                        "Portfolio PnL",
                        f"{result['portfolio_pnl']:.4f}",
                    )

                st.subheader("Trade-Level Scenario Results")

                scenario_results_df = pd.DataFrame(result["trade_results"])
                scenario_results_df = scenario_results_df.round(4)
                st.dataframe(scenario_results_df, use_container_width=True)

                st.subheader("Scenario PnL by Trade")

                pnl_chart = scenario_results_df.set_index("trade_id")["pnl"]
                st.bar_chart(pnl_chart)


                st.subheader("Base vs Shocked Market Value")

                base_vs_shocked_df = scenario_results_df[
                    ["trade_id", "base_market_value", "shocked_market_value"]
                ].set_index("trade_id")

                st.bar_chart(base_vs_shocked_df)

                if result["errors"]:
                    st.subheader("Errors")
                    st.dataframe(pd.DataFrame(result["errors"]), use_container_width=True)

                st.download_button(
                    label="Download Scenario Results as CSV",
                    data=scenario_results_df.to_csv(index=False),
                    file_name="equirisk_scenario_results.csv",
                    mime="text/csv",
                )

                st.subheader("Raw API Response")
                st.json(result)

            else:
                st.error("API returned an error.")
                st.write(response.json())

        except requests.exceptions.ConnectionError:
            st.error("Could not connect to FastAPI. Make sure backend is running.")

        except Exception as error:
            st.error(f"Unexpected error: {error}")