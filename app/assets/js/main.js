//import "./jquery.min.js";

import { default as dropotron } from "./jquery.dropotron.min.js";
import "./browser.min.js";
import { default as breakpoints } from "./breakpoints.min.js";
import "./util.js";
import "JSEncrypt";

//import 'bootstrap';
//import 'bootstrap/dist/css/bootstrap.min.css';

import { default as Web3 } from 'web3';
//import { default as contract } from 'truffle-contract';
//import { default as ipfsAPI } from 'ipfs-api';
//import { default as Bzz } from 'web3-bzz';
//import Bzz from 'web3-bzz';
import Buzz from '@web3/buzz'

var Buffer = require('buffer/').Buffer

//const buzz = new Buzz({ provider: 'http://swarm.hissbb.com' });
const buzz = new Buzz({ provider: 'http://swarm-gateways.net' });

//const swarm = require("swarm-js").at("http://swarm.hissbb.com");

// Import our contract artifacts and turn them into usable abstractions.
import HissContractDesc from '../../../build/contracts/Hiss.json';


(function ($) {
	var $window = $(window),
		$body = $('body');

	// Breakpoints.
	breakpoints({
		normal: ['1081px', '1280px'],
		narrow: ['821px', '1080px'],
		narrower: ['737px', '820px'],
		mobile: ['481px', '736px'],
		mobilep: [null, '480px']
	});

	// Play initial animations on page load.
	$window.on('load', function () {
		window.setTimeout(function () {
			$body.removeClass('is-preload');
		}, 100);
	});

	// Dropdowns.
	$('#nav > ul').dropotron({
		mode: 'fade',
		speed: 300,
		alignment: 'center',
		noOpenerFade: true
	});

	// Nav.

	// Button.
	$(
		'<div id="navButton">' +
		'<a href="#navPanel" class="toggle"></a>' +
		'</div>'
	)
		.appendTo($body);

	// Panel.
	$(
		'<div id="navPanel">' +
		'<nav>' +
		'<a href="index.html" class="link depth-0">HISS</a>' +
		$('#nav').navList() +
		'</nav>' +
		'</div>'
	)
		.appendTo($body)
		.panel({
			delay: 500,
			hideOnClick: true,
			resetScroll: true,
			resetForms: true,
			side: 'top',
			target: $body,
			visibleClass: 'navPanel-visible'
		});

	if (typeof web3 === 'undefined') {
		alert("Включите Metamask")
	} else {
		const address = "0x262178ecdcbea581c06dc1629a39a40757ee3e55";
		var HissContract = web3.eth.contract(HissContractDesc.abi).at(address);
		web3.eth.getAccounts(function (err, accs) {
			if (err != null) {
				alert("There was an error fetching your accounts.");
				return;
			}

			if (accs.length == 0) {
				alert("Couldn't get any accounts! Make sure your Ethereum client is configured correctly.");
				return;
			}

			var accounts = accs;
			var account = accounts[0];

			// Doctor
			$("#DoctorButtonPAddNote").click(function () {
				HissContract.keyByAddress.call(
					$("#DoctorPAddressToAdding1").val(),
					(e, r) => {
						var crypt = new JSEncrypt();
						crypt.setPublicKey(r);
						var encryptedNote = crypt.encrypt($('#note').val());

						buzz.upload(encryptedNote).then((hash) => {
							let url = `http://swarm-gateways.net/bzz-raw:/${hash}`
							console.log(`Url --> ${url}`)
							document.getElementById("DoctorSwarmUrlNote").innerHTML = url
							document.getElementById("DoctorSwarmUrlNote").href = url
							HissContract.addNewNote(
								$("#DoctorPAddressToAdding1").val(),
								hash,
								(e, myTxHash) => {
									web3.eth.filter('latest', function (error, result) {
										web3.eth.getBlock(result, (e, b) => {
											var t = b.transactions
											for (var i = 0; i < t.length; i++)
												if (t[i] == myTxHash) {
													alert("Запись добавлена в блокчейн");
												}
										})
									})
								});
						});
					});
			});
			$("#DoctorButtonPSubmitMedFile").click(function () {
				const reader = new FileReader();
				reader.onloadend = function () {
					HissContract.keyByAddress.call(
						$("#DoctorPAddressToAdding2").val(),
						(e, r) => {
							var crypt = new JSEncrypt();
							crypt.setPublicKey(r);
							var encryptedNote = crypt.encrypt(reader.result);
							//const buf = Buffer.from(reader.result) // Convert data into buffer
							console.log(encryptedNote);
							buzz.upload(encryptedNote).then((hash) => {
								let url = `http://swarm-gateways.net/bzz-raw:/${hash}`
								console.log(`Url --> ${url}`)
								document.getElementById("DoctorSwarmUrlFile").innerHTML = url
								document.getElementById("DoctorSwarmUrlFile").href = url
								HissContract.addNewNote(
									$("#DoctorPAddressToAdding2").val(),
									hash,
									(e, myTxHash) => {
										web3.eth.filter('latest', function (error, result) {
											web3.eth.getBlock(result, (e, b) => {
												var t = b.transactions
												for (var i = 0; i < t.length; i++)
													if (t[i] == myTxHash) {
														alert("Запись добавлена в блокчейн");
													}
											})
										})
									});
							});
						});
				}
				const medFile = document.getElementById("medFile");
				console.log(medFile.files[0]);
				reader.readAsArrayBuffer(medFile.files[0]); // Read Provided File
			});
			$("#DoctorButtonPNumberOfNotes").click(function () {
				HissContract.numberOfNotes.call(
					$("#DoctorPAddressToAdding3").val(),
					(e, r) => {
						alert("Количество записей у пациента: " + r)
					})
			});
			$("#DoctorButtonPHashes").click(function () {
				HissContract.hashes.call(
					$("#DoctorPAddressToAdding4").val(),
					$("#DoctorNoteNumber").val() - 1,
					(e, hash) => {
						var crypt = new JSEncrypt();
						crypt.setPrivateKey($('#DoctorPPrivateKey').val());
						//var uncrypted = crypt.decrypt(r);
						//alert(uncrypted);
						buzz.download(hash).then((file) => {
							var uncrypted = crypt.decrypt(file);
							console.log(uncrypted);
							alert(uncrypted);
						});
					})
			});

			// Insurance
			$("#InsuranceButtonAddHospital").click(function () {
				HissContract.addHospital(
					$('#InsuranceHAddress').val(),
					$('#InsuranceHDigitalSign').val(),
					{ from: account, value: web3.toWei("0.07", 'ether') },
					(e, myTxHash) => {
						web3.eth.filter('latest', function (error, result) {
							web3.eth.getBlock(result, (e, b) => {
								var t = b.transactions
								for (var i = 0; i < t.length; i++)
									if (t[i] == myTxHash) {
										alert("Медицинское учреждение успешно добавлено");
									}
							});
						});
					})
			});
			$("#InsuranceAddPatient").click(function () {
				var crypt = new JSEncrypt({ default_key_size: 1024 });
				crypt.getKey();
				var PublicKey = crypt.getPublicKey();
				var PrivateKey = crypt.getPrivateKey();
				$('#InsurancePPublicKey').val(PublicKey);
				$('#InsurancePPrivateKey').val(PrivateKey);

				var encryptedFirstNote = crypt.encrypt($('#InsurancePFirstNote').val());
				console.log(encryptedFirstNote);

				buzz.upload(encryptedFirstNote).then((hash) => {
					let url = `http://swarm-gateways.net/bzz-raw:/${hash}`
					console.log(`Url --> ${url}`)
					document.getElementById("InsuranceSwarmUrlNote").innerHTML = url
					document.getElementById("InsuranceSwarmUrlNote").href = url
					HissContract.addPatient(
						$("#InsurancePAddress1").val(),
						PublicKey,
						hash,
						{ from: account, value: web3.toWei("0.07", 'ether') },
						(e, myTxHash) => {
							web3.eth.filter('latest', function (error, result) {
								web3.eth.getBlock(result, (e, b) => {
									var t = b.transactions
									for (var i = 0; i < t.length; i++)
										if (t[i] == myTxHash) {
											alert("Пациент успешно добавлен");
										}
								})
							})
						});
				});
			});
			$("#InsuranceShowPatientStatus").click(function () {
				HissContract.isInsuranceActive.call(
					$('#InsurancePAddress2').val(),
					(err, res) => {
						if (err != null) {
							alert("Произошла ошибка при проверке статуса пациента: " + err);
						} else {
							if (res == true) {
								alert('Страховка действительна');
							} else {
								alert('Страховка не действительна');
							}
						}
					})
			});
			$("#InsuranceEnablePInsurance").click(function () {
				HissContract.setInsuranceStatus(
					$('#InsurancePAddress3').val(),
					true,
					(e, myTxHash) => {
						web3.eth.filter('latest', function (error, result) {
							web3.eth.getBlock(result, (e, b) => {
								var t = b.transactions
								for (var i = 0; i < t.length; i++)
									if (t[i] == myTxHash) {
										alert("Страховка активирована");
									}
							});
						});
					})
			});
			$("#InsuranceDisablePInsurance").click(function () {
				HissContract.setInsuranceStatus(
					$('#InsurancePAddress3').val(),
					false,
					(e, myTxHash) => {
						web3.eth.filter('latest', function (error, result) {
							web3.eth.getBlock(result, (e, b) => {
								var t = b.transactions
								for (var i = 0; i < t.length; i++)
									if (t[i] == myTxHash) {
										alert("Страховка деактивирована");
									}
							});
						});
					})
			});

			//Patient
			$("#PatientButtonCheck").click(function () {
				HissContract.isInsuranceActive.call(account, (e, r) => {
					if (r == true) {
						alert("Страховка действительна");
					} else {
						alert("Страховка не действительна");
					}
				})
			});
			$("#PatientButtonConsent").click(function () {
				HissContract.consentToAddData($("#PatientHAddress").val(),
					(e, myTxHash) => {
						web3.eth.filter('latest', function (error, result) {
							web3.eth.getBlock(result, (e, b) => {
								var t = b.transactions
								for (var i = 0; i < t.length; i++)
									if (t[i] == myTxHash) {
										alert("Добавлен")
									}
							})
						})
					})
			});
			$("#PatientButtonNumberOfNotes").click(function () {
				HissContract.numberOfNotes.call(account,
					(e, r) => {
						alert("Количество записей для вашего адреса: " + r)
					})
			});
			$("#PatientButtonHashes").click(function () {
				HissContract.hashes.call(account,
					$("#PatientNoteNumber").val() - 1,
					(e, hash) => {
						var crypt = new JSEncrypt();
						crypt.setPrivateKey($('#PatientPPrivateKey').val());
						//var uncrypted = crypt.decrypt(r);
						//alert(uncrypted);
						buzz.download(hash).then((file) => {
							var uncrypted = crypt.decrypt(file);
							console.log(uncrypted);
							alert(uncrypted);
						});
			});
		});
	});
	};
})(jQuery);
