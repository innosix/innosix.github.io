document.addEventListener('DOMContentLoaded', function () {
    const loginFormElm = document.getElementById('loginForm');
    const apiFormElm = document.getElementById('apiForm');
    const historyElm = document.getElementById('historyCont');

    checkLogin();
    getHistory();
    
    loginFormElm.addEventListener('submit', function (event) {
        event.preventDefault();

        const formData = new FormData(event.target);
        fetch('https://ykd1w81sxg.execute-api.ap-northeast-2.amazonaws.com/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: formDataToJSON(formData)
        })
            .then(response => response.json())
            .then(data => {
                if (data.token) {
                    localStorage.setItem('token', data.token);
                    checkLogin('로그인 성공');
                    getHistory();
                }
            })
            .catch(error => {
                checkLogin('로그인 실패');
            });

        return false;
    });

    apiFormElm.addEventListener('submit', function (event) {
        event.preventDefault();
        if (!checkLogin('로그인이 만료되었습니다. 다시 로그인하세요.')) return;

        document.getElementById('result').innerText = "";

        const formData = new FormData(event.target);

        const macAddrPattern = /^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/;
        if (!macAddrPattern.test(formData.get('mac'))) {
            showToast('유효한 MAC 주소를 입력해주세요.');
            return;
        }

        fetch('https://ykd1w81sxg.execute-api.ap-northeast-2.amazonaws.com/key/create', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: formDataToJSON(formData)
        }).then(response => {
            if (response.status !== 200) {
                checkLogin('로그인이 만료되었습니다. 다시 로그인하세요.');
            }
            return response.json();
        }).then(data => {
            if (data.key) {
                document.getElementById('result').innerText = `Key: ${data.key}`;
            } else {
                document.getElementById('result').innerText = "";
            }
            getHistory();
        }).catch(error => {
            loginFormElm.style.display = 'block';
            apiFormElm.style.display = 'none';
            historyElm.style.display = 'none';
            console.error('Error:', error);
        });
    });

    function checkLogin(errMsg) {
        const token = localStorage.getItem('token');
        if (!token) {
            if (errMsg) {
                showToast(errMsg);
            }
            loginFormElm.style.display = 'block';
            apiFormElm.style.display = 'none';
            historyElm.style.display = 'none';
            localStorage.removeItem('token');
            return false;
        }

        apiFormElm.style.display = 'block';
        historyElm.style.display = 'block';
        loginFormElm.style.display = 'none'; 
        return true;
    }

    function formDataToJSON(formData) {
        const object = {};
        for (const [key, value] of formData.entries()) {
            if (object[key]) {
                if (!Array.isArray(object[key])) {
                    object[key] = [object[key]];
                }
                object[key].push(value);
            } else {
                object[key] = value;
            }
        }
        return JSON.stringify(object);
    }

    function showToast(message) {
        const toast = document.getElementById("toast");
        toast.className = toast.className.replace("show", "");
        setTimeout(function () {
            toast.innerText = message;
            toast.className = "show";
        }, 100);
    }

    function getHistory() {
        fetch('https://ykd1w81sxg.execute-api.ap-northeast-2.amazonaws.com/key', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        }).then(response => {
            return response.json();
        }).then(data => {
            data = data.reverse();
            var list = [];
            for (let i = 0; i < data.length; i++) {
                list.push(`name: ${data[i].name} HOST: ${data[i].host} MAC: ${data[i].mac}, Key: ${data[i].key}`);
            }
            document.getElementById('history').textContent = list.join('\n');
        }).catch(error => {
            loginFormElm.style.display = 'block';
            apiFormElm.style.display = 'none';
            historyElm.style.display = 'none';
            console.error('Error:', error);
        });
    }

    document.getElementById('toggleHistory').addEventListener('click', function () {
        var history = document.getElementById('history');
        if (history.style.display != 'block') {
            history.style.display = 'block';
        } else {
            history.style.display = 'none';
        }
    });
});

