<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <title>SULAIMAN 777 | Premium Gaming Tool</title>
    <style>
        :root {
            --primary-red: #ff0000;
            --dark-red: #8a0000;
            --black: #050505;
            --dark-gray: #1a1a1a;
            --text-white: #ffffff;
            --glow: 0 0 15px var(--primary-red), 0 0 30px var(--primary-red);
            --font-main: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        }

        * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
            user-select: none;
            -webkit-tap-highlight-color: transparent;
        }

        body {
            background-color: var(--black);
            color: var(--text-white);
            font-family: var(--font-main);
            overflow-x: hidden;
            height: 100vh;
            display: flex;
            flex-direction: column;
        }

        /* Background Animation */
        .bg-overlay {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: radial-gradient(circle at center, #2a0000 0%, #000000 100%);
            z-index: -1;
            animation: pulseBg 5s infinite alternate;
        }

        @keyframes pulseBg {
            0% { transform: scale(1); opacity: 0.8; }
            100% { transform: scale(1.1); opacity: 1; }
        }

        /* Logo Styling */
        .logo-container {
            text-align: center;
            margin: 20px 0;
            animation: fadeInDown 1s ease-out;
        }

        .logo-text {
            font-size: 2.5rem;
            font-weight: 900;
            color: var(--primary-red);
            text-transform: uppercase;
            letter-spacing: 3px;
            text-shadow: var(--glow);
            font-style: italic;
        }

        .sub-logo {
            font-size: 0.9rem;
            color: #ccc;
            letter-spacing: 1px;
            margin-top: 5px;
        }

        /* Screens */
        .screen {
            display: none;
            width: 100%;
            height: 100%;
            padding: 20px;
            overflow-y: auto;
            animation: fadeIn 0.5s ease-in-out;
        }

        .screen.active {
            display: flex;
            flex-direction: column;
            align-items: center;
        }

        /* Login Screen */
        .login-box {
            background: rgba(20, 20, 20, 0.9);
            border: 2px solid var(--primary-red);
            border-radius: 15px;
            padding: 30px;
            width: 100%;
            max-width: 400px;
            box-shadow: var(--glow);
            text-align: center;
        }

        input[type="text"], input[type="password"] {
            width: 100%;
            padding: 15px;
            margin: 15px 0;
            background: #000;
            border: 1px solid #333;
            color: var(--primary-red);
            font-size: 1.1rem;
            border-radius: 8px;
            outline: none;
            transition: 0.3s;
            text-align: center;
        }

        input:focus {
            border-color: var(--primary-red);
            box-shadow: 0 0 10px rgba(255, 0, 0, 0.3);
        }

        /* Buttons */
        .btn {
            background: linear-gradient(45deg, var(--dark-red), var(--primary-red));
            color: white;
            border: none;
            padding: 15px 30px;
            font-size: 1rem;
            font-weight: bold;
            border-radius: 50px;
            cursor: pointer;
            text-transform: uppercase;
            box-shadow: 0 0 15px var(--dark-red);
            transition: all 0.3s ease;
            width: 100%;
            margin-top: 10px;
            position: relative;
            overflow: hidden;
        }

        .btn:active {
            transform: scale(0.95);
            box-shadow: 0 0 5px var(--primary-red);
        }

        .btn:hover {
            box-shadow: var(--glow);
        }

        .btn-secondary {
            background: transparent;
            border: 1px solid var(--primary-red);
            margin-top: 10px;
        }

        /* Dashboard Grid */
        .dashboard-grid {
            display: grid;
            grid-template-columns: 1fr;
            gap: 15px;
            width: 100%;
            max-width: 500px;
        }

        .card {
            background: rgba(30, 30, 30, 0.8);
            border: 1px solid #333;
            border-left: 4px solid var(--primary-red);
            padding: 20px;
            border-radius: 10px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.3);
            transition: 0.3s;
        }

        .card:hover {
            transform: translateY(-2px);
            border-color: var(--primary-red);
            box-shadow: 0 0 15px rgba(255, 0, 0, 0.2);
        }

        .card h3 {
            color: var(--primary-red);
            margin-bottom: 10px;
            font-size: 1.1rem;
            display: flex;
            align-items: center;
            justify-content: space-between;
        }

        /* Sensitivity Sliders */
        .slider-container {
            margin-bottom: 15px;
        }

        .slider-label {
            display: flex;
            justify-content: space-between;
            font-size: 0.9rem;
            margin-bottom: 5px;
            color: #ddd;
        }

        input[type="range"] {
            width: 100%;
            height: 5px;
            background: #333;
            border-radius: 5px;
            outline: none;
            -webkit-appearance: none;
        }

        input[type="range"]::-webkit-slider-thumb {
            -webkit-appearance: none;
            width: 20px;
            height: 20px;
            background: var(--primary-red);
            border-radius: 50%;
            cursor: pointer;
            box-shadow: 0 0 10px var(--primary-red);
        }

        /* Status Indicators */
        .status-badge {
            display: inline-block;
            padding: 5px 10px;
            border-radius: 4px;
            font-size: 0.8rem;
            font-weight: bold;
        }

        .status-online { background: #00ff00; color: #000; box-shadow: 0 0 10px #00ff00; }
        .status-locked { background: var(--primary-red); color: #fff; box-shadow: 0 0 10px var(--primary-red); }

        /* Footer */
        .footer-text {
            margin-top: 30px;
            font-size: 0.8rem;
            color: #666;
            text-align: center;
        }

        /* Animations */
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
        }

        @keyframes fadeInDown {
            from { opacity: 0; transform: translateY(-20px); }
            to { opacity: 1; transform: translateY(0); }
        }

        /* Loading Spinner */
        .loader {
            border: 4px solid #333;
            border-top: 4px solid var(--primary-red);
            border-radius: 50%;
            width: 40px;
            height: 40px;
            animation: spin 1s linear infinite;
            margin: 20px auto;
            display: none;
        }

        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }

        /* Sound Toggle */
        .sound-toggle {
            position: absolute;
            top: 15px;
            right: 15px;
            background: none;
            border: 1px solid var(--primary-red);
            color: var(--primary-red);
            padding: 5px 10px;
            border-radius: 20px;
            font-size: 0.8rem;
            cursor: pointer;
            z-index: 100;
        }

        /* Error Message */
        .error-msg {
            color: var(--primary-red);
            font-size: 0.9rem;
            margin-top: 10px;
            display: none;
            animation: shake 0.5s;
        }

        @keyframes shake {
            0% { transform: translateX(0); }
            25% { transform: translateX(-5px); }
            50% { transform: translateX(5px); }
            75% { transform: translateX(-5px); }
            100% { transform: translateX(0); }
        }

        /* Device Info Table */
        .info-table {
            width: 100%;
            font-size: 0.85rem;
            color
