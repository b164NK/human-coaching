window.onload = function(){
  //タッチイベントが利用可能かどうかの判別
	var supportTouch = 'ontouchend' in document;

	//イベント名の決定
	const EVENTNAME_START = supportTouch? 'touchstart':'mousedown';
	const EVENTNAME_MOVE = supportTouch? 'touchmove':'mousemove';
	const EVENTNAME_END = supportTouch? 'touchend':'mouseup';

  // Get a reference to the database service
  var database = firebase.database();

	//Vueインスタンスが存在するかどうかを判別するフラグ
	var first = true;

	//更新内容を一時保存する変数
	var updates = {};


	function renewDB(update_set){
		//update_setは、行われたDOM操作に関して記録したリストとする
		console.log("DB update");
		database.ref("").update(update_set);
		//updatesを初期化
		updates = {};
	};

	//Vueインスタンスをいれる変数
	//インスタンス外部からメソッドを呼ぶのに利用する
	var vm;

  function createV(fss){
    vm = new Vue({
      el:"#app",
      data:{
        canvas:       	0,
        scene:        	new THREE.Scene(),
        renderer:     	new THREE.WebGLRenderer({anitialias: true}),
        camera:       	new THREE.PerspectiveCamera(45,1,1,10000),
        controls:     	0,
        light:        	new THREE.DirectionalLight(0xFFFFFF, 1),
        human:        	new THREE.Group(),
				mouse:					new THREE.Vector2(),
				raycaster: 			new THREE.Raycaster(),
				intersects:			0,
				//キーフレームトラックを保持(データベースとのデータ共有に使用)
				keyframetracks:	[],
        //アニメーションクリップを保持(データベースとのデータ共有に使用)
        clips:        	[],
				//ミキサーを保持(アニメーション実行に使用)
				mixers:					[],
        //アニメーションアクションを保持(アニメーション実行に使用)
        actions:      	[],
        eventstart:   	EVENTNAME_START,
        eventmove:    	EVENTNAME_MOVE,
        eventend:     	EVENTNAME_END
      },
      methods:{
				//データが変更された時実行する
        changed_DB_bySomeone:function(ss){

        },
				//アニメーションを再生する
				animate:function(e){
					this.controls.enabled = true;

					console.log("再生中");

					this.mixers[0].update(0.01);
					this.mixers[1].update(0.01);
					this.mixers[2].update(0.01);
					this.mixers[3].update(0.01);
					this.mixers[4].update(0.01);

					this.controls.update();

					this.renderer.render(this.scene, this.camera);

					if(this.actions[0].isRunning() == false &&
							this.actions[1].isRunning() == false &&
							this.actions[2].isRunning() == false &&
							this.actions[3].isRunning() == false &&
							this.actions[4].isRunning() == false){
						const flag = true;
						try {
								if (flag) {
										this.controls.enabled = false;
										throw new Error('終了します');
								};
						} catch (e) {
								console.log(e.message);
						};

					}else{
						requestAnimationFrame(this.animate);
					};

				}
      },
      mounted(){
        this.canvas = document.getElementById('canvas');
        this.canvas.appendChild(this.renderer.domElement);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.setSize(this.canvas.clientWidth, this.canvas.clientHeight);
        this.camera.aspect = this.canvas.clientWidth / this.canvas.clientHeight;
        this.camera.position.set(0, 400, 1000);
        this.camera.lookAt(new THREE.Vector3(0,0,0));

        this.controls = new THREE.OrbitControls(this.camera);
				this.controls.target.set(0, 250, 0);
				this.controls.enableZoom = false;
				this.controls.enabled = false;

        //地面を作成
        const plane2 = new THREE.GridHelper(600);
        this.scene.add(plane2);
        const plane = new THREE.AxesHelper(300);
        this.scene.add(plane);

        //体
        const body_material = new THREE.MeshNormalMaterial();
        const body_geometry = new THREE.BoxGeometry(50,150,50);
        const body = new THREE.Mesh(body_geometry,body_material);
        body.position.set(0,250,0);
        this.human.add(body);

        //頭
        const head_geometry = new THREE.SphereGeometry(30,30,30);
        const head = new THREE.Mesh(head_geometry,body_material);
        head.position.set(0,110,0);
        body.add(head)

        //腕
        const arm_material =  new THREE.LineBasicMaterial({
          color:'white'
        });
        const right_arm_points = [];
        right_arm_points.push(new THREE.Vector3(0,0,0));
        right_arm_points.push(new THREE.Vector3(-50,0,0));
        const right_arm_geometry = new THREE.BufferGeometry().setFromPoints( right_arm_points );
        const right_arm_1 = new THREE.Line( right_arm_geometry, arm_material );
        const right_arm_2 = right_arm_1.clone();
        right_arm_2.position.set(-50,0,0);
        right_arm_1.add(right_arm_2);
        right_arm_1.position.set(-25,75,0);
        body.add(right_arm_1);

        const left_arm_points = [];
        left_arm_points.push(new THREE.Vector3(0,0,0));
        left_arm_points.push(new THREE.Vector3(50,0,0));
        const left_arm_geometry = new THREE.BufferGeometry().setFromPoints( left_arm_points );
        const left_arm_1 = new THREE.Line( left_arm_geometry, arm_material );
        const left_arm_2 = left_arm_1.clone();
        left_arm_2.position.set(50,0,0);
        left_arm_1.add(left_arm_2);
        left_arm_1.position.set(25,75,0);
        body.add(left_arm_1);

        //腰
        const waist_geometry = new THREE.BoxGeometry(50,20,50);
        const waist = new THREE.Mesh(waist_geometry, body_material);
        this.human.add(waist);
        waist.position.set(0,160,0);

        //足
        const foot_material =  new THREE.LineBasicMaterial({
          color:'white'
        });
        const right_foot_points = [];
        right_foot_points.push(new THREE.Vector3(0,0,0));
        right_foot_points.push(new THREE.Vector3(0,-80,0));
        const right_foot_geometry = new THREE.BufferGeometry().setFromPoints( right_foot_points );
        const right_foot_1 = new THREE.Line( right_foot_geometry, foot_material );
        const right_foot_2 = right_foot_1.clone();
        right_foot_2.position.set(0,-80,0);
        right_foot_1.add(right_foot_2);
        right_foot_1.position.set(-25,0,0);
        waist.add(right_foot_1);

        const left_foot_points = [];
        left_foot_points.push(new THREE.Vector3(0,0,0));
        left_foot_points.push(new THREE.Vector3(0,-80,0));
        const left_foot_geometry = new THREE.BufferGeometry().setFromPoints( left_foot_points );
        const left_foot_1 = new THREE.Line( left_foot_geometry, foot_material );
        const left_foot_2 = left_foot_1.clone();
        left_foot_2.position.set(0,-80,0);
        left_foot_1.add(left_foot_2);
        left_foot_1.position.set(25,0,0);
        waist.add(left_foot_1);

        this.scene.add(this.human);



        //これより以下でfssからアニメーションクリップを作成
				//各部位毎-各軸毎にKeyframeTrackJSONを作成
				var rotationKeyframeTrackJSON_Body_x = {
					name:".children[0].rotation[x]",
					type:"number",
					times:[0],
					values:[0]
				};
				var rotationKeyframeTrackJSON_Body_y = {
					name:".children[0].rotation[y]",
					type:"number",
					times:[0],
					values:[0]
				};
				var rotationKeyframeTrackJSON_Body_z = {
					name:".children[0].rotation[z]",
					type:"number",
					times:[0],
					values:[0]
				};

				var rotationKeyframeTrackJSON_RightArm1_x = {
					name:".rotation[x]",
					type:"number",
					times:[0],
					values:[0]
				};
				var rotationKeyframeTrackJSON_RightArm1_y = {
					name:".rotation[y]",
					type:"number",
					times:[0],
					values:[0]
				};
				var rotationKeyframeTrackJSON_RightArm1_z = {
					name:".rotation[z]",
					type:"number",
					times:[0],
					values:[0]
				};

				var rotationKeyframeTrackJSON_RightArm2_x = {
					name:".children[0].rotation[x]",
					type:"number",
					times:[0],
					values:[0]
				};
				var rotationKeyframeTrackJSON_RightArm2_y = {
					name:".children[0].rotation[y]",
					type:"number",
					times:[0],
					values:[0]
				};
				var rotationKeyframeTrackJSON_RightArm2_z = {
					name:".children[0].rotation[z]",
					type:"number",
					times:[0],
					values:[0]
				};

				var rotationKeyframeTrackJSON_LeftArm1_x = {
					name:".rotation[x]",
					type:"number",
					times:[0],
					values:[0]
				};
				var rotationKeyframeTrackJSON_LeftArm1_y = {
					name:".rotation[y]",
					type:"number",
					times:[0],
					values:[0]
				};
				var rotationKeyframeTrackJSON_LeftArm1_z = {
					name:".rotation[z]",
					type:"number",
					times:[0],
					values:[0]
				};

				var rotationKeyframeTrackJSON_LeftArm2_x = {
					name:".children[0].rotation[x]",
					type:"number",
					times:[0],
					values:[0]
				};
				var rotationKeyframeTrackJSON_LeftArm2_y = {
					name:".children[0].rotation[y]",
					type:"number",
					times:[0],
					values:[0]
				};
				var rotationKeyframeTrackJSON_LeftArm2_z = {
					name:".children[0].rotation[z]",
					type:"number",
					times:[0],
					values:[0]
				};

				var rotationKeyframeTrackJSON_Waist_x = {
					name:".children[1].rotation[x]",
					type:"number",
					times:[0],
					values:[0]
				};
				var rotationKeyframeTrackJSON_Waist_y = {
					name:".children[1].rotation[y]",
					type:"number",
					times:[0],
					values:[0]
				};
				var rotationKeyframeTrackJSON_Waist_z = {
					name:".children[1].rotation[z]",
					type:"number",
					times:[0],
					values:[0]
				};

				var rotationKeyframeTrackJSON_RightFoot1_x = {
					name:".rotation[x]",
					type:"number",
					times:[0],
					values:[0]
				};
				var rotationKeyframeTrackJSON_RightFoot1_y = {
					name:".rotation[y]",
					type:"number",
					times:[0],
					values:[0]
				};
				var rotationKeyframeTrackJSON_RightFoot1_z = {
					name:".rotation[z]",
					type:"number",
					times:[0],
					values:[0]
				};

				var rotationKeyframeTrackJSON_RightFoot2_x = {
					name:".children[0].rotation[x]",
					type:"number",
					times:[0],
					values:[0]
				};
				var rotationKeyframeTrackJSON_RightFoot2_y = {
					name:".children[0].rotation[y]",
					type:"number",
					times:[0],
					values:[0]
				};
				var rotationKeyframeTrackJSON_RightFoot2_z = {
					name:".children[0].rotation[z]",
					type:"number",
					times:[0],
					values:[0]
				};

				var rotationKeyframeTrackJSON_LeftFoot1_x = {
					name:".rotation[x]",
					type:"number",
					times:[0],
					values:[0]
				};
				var rotationKeyframeTrackJSON_LeftFoot1_y = {
					name:".rotation[y]",
					type:"number",
					times:[0],
					values:[0]
				};
				var rotationKeyframeTrackJSON_LeftFoot1_z = {
					name:".rotation[z]",
					type:"number",
					times:[0],
					values:[0]
				};

				var rotationKeyframeTrackJSON_LeftFoot2_x = {
					name:".children[0].rotation[x]",
					type:"number",
					times:[0],
					values:[0]
				};
				var rotationKeyframeTrackJSON_LeftFoot2_y = {
					name:".children[0].rotation[y]",
					type:"number",
					times:[0],
					values:[0]
				};
				var rotationKeyframeTrackJSON_LeftFoot2_z = {
					name:".children[0].rotation[z]",
					type:"number",
					times:[0],
					values:[0]
				};

				this.keyframetracks.push(rotationKeyframeTrackJSON_Body_x);
				this.keyframetracks.push(rotationKeyframeTrackJSON_Body_y);
				this.keyframetracks.push(rotationKeyframeTrackJSON_Body_z);
				this.keyframetracks.push(rotationKeyframeTrackJSON_RightArm1_x);
				this.keyframetracks.push(rotationKeyframeTrackJSON_RightArm1_y);
				this.keyframetracks.push(rotationKeyframeTrackJSON_RightArm1_z);
				this.keyframetracks.push(rotationKeyframeTrackJSON_RightArm2_x);
				this.keyframetracks.push(rotationKeyframeTrackJSON_RightArm2_y);
				this.keyframetracks.push(rotationKeyframeTrackJSON_RightArm2_z);
				this.keyframetracks.push(rotationKeyframeTrackJSON_LeftArm1_x);
				this.keyframetracks.push(rotationKeyframeTrackJSON_LeftArm1_y);
				this.keyframetracks.push(rotationKeyframeTrackJSON_LeftArm1_z);
				this.keyframetracks.push(rotationKeyframeTrackJSON_LeftArm2_x);
				this.keyframetracks.push(rotationKeyframeTrackJSON_LeftArm2_y);
				this.keyframetracks.push(rotationKeyframeTrackJSON_LeftArm2_z);
				this.keyframetracks.push(rotationKeyframeTrackJSON_Waist_x);
				this.keyframetracks.push(rotationKeyframeTrackJSON_Waist_y);
				this.keyframetracks.push(rotationKeyframeTrackJSON_Waist_z);
				this.keyframetracks.push(rotationKeyframeTrackJSON_RightFoot1_x);
				this.keyframetracks.push(rotationKeyframeTrackJSON_RightFoot1_y);
				this.keyframetracks.push(rotationKeyframeTrackJSON_RightFoot1_z);
				this.keyframetracks.push(rotationKeyframeTrackJSON_RightFoot2_x);
				this.keyframetracks.push(rotationKeyframeTrackJSON_RightFoot2_y);
				this.keyframetracks.push(rotationKeyframeTrackJSON_RightFoot2_z);
				this.keyframetracks.push(rotationKeyframeTrackJSON_LeftFoot1_x);
				this.keyframetracks.push(rotationKeyframeTrackJSON_LeftFoot1_y);
				this.keyframetracks.push(rotationKeyframeTrackJSON_LeftFoot1_z);
				this.keyframetracks.push(rotationKeyframeTrackJSON_LeftFoot2_x);
				this.keyframetracks.push(rotationKeyframeTrackJSON_LeftFoot2_y);
				this.keyframetracks.push(rotationKeyframeTrackJSON_LeftFoot2_z);
				//keyframetracksは30個


				//スナップショットからデータを取得
				this.keyframetracks[0].times = fss.child('AnimationClip/body/x/times').val();
				this.keyframetracks[0].values = fss.child('AnimationClip/body/x/values').val();
				this.keyframetracks[1].times = fss.child('AnimationClip/body/y/times').val();
				this.keyframetracks[1].values = fss.child('AnimationClip/body/y/values').val();
				this.keyframetracks[2].times = fss.child('AnimationClip/body/z/times').val();
				this.keyframetracks[2].values = fss.child('AnimationClip/body/z/values').val();

				this.keyframetracks[3].times = fss.child('AnimationClip/right_arm_1/x/times').val();
				this.keyframetracks[3].values = fss.child('AnimationClip/right_arm_1/x/values').val();
				this.keyframetracks[4].times = fss.child('AnimationClip/right_arm_1/y/times').val();
				this.keyframetracks[4].values = fss.child('AnimationClip/right_arm_1/y/values').val();
				this.keyframetracks[5].times = fss.child('AnimationClip/right_arm_1/z/times').val();
				this.keyframetracks[5].values = fss.child('AnimationClip/right_arm_1/z/values').val();

				this.keyframetracks[6].times = fss.child('AnimationClip/right_arm_2/x/times').val();
				this.keyframetracks[6].values = fss.child('AnimationClip/right_arm_2/x/values').val();
				this.keyframetracks[7].times = fss.child('AnimationClip/right_arm_2/y/times').val();
				this.keyframetracks[7].values = fss.child('AnimationClip/right_arm_2/y/values').val();
				this.keyframetracks[8].times = fss.child('AnimationClip/right_arm_2/z/times').val();
				this.keyframetracks[8].values = fss.child('AnimationClip/right_arm_2/z/values').val();

				this.keyframetracks[9].times = fss.child('AnimationClip/left_arm_1/x/times').val();
				this.keyframetracks[9].values = fss.child('AnimationClip/left_arm_1/x/values').val();
				this.keyframetracks[10].times = fss.child('AnimationClip/left_arm_1/y/times').val();
				this.keyframetracks[10].values = fss.child('AnimationClip/left_arm_1/y/values').val();
				this.keyframetracks[11].times = fss.child('AnimationClip/left_arm_1/z/times').val();
				this.keyframetracks[11].values = fss.child('AnimationClip/left_arm_1/z/values').val();

				this.keyframetracks[12].times = fss.child('AnimationClip/left_arm_2/x/times').val();
				this.keyframetracks[12].values = fss.child('AnimationClip/left_arm_2/x/values').val();
				this.keyframetracks[13].times = fss.child('AnimationClip/left_arm_2/y/times').val();
				this.keyframetracks[13].values = fss.child('AnimationClip/left_arm_2/y/values').val();
				this.keyframetracks[14].times = fss.child('AnimationClip/left_arm_2/z/times').val();
				this.keyframetracks[14].values = fss.child('AnimationClip/left_arm_2/z/values').val();

				this.keyframetracks[15].times = fss.child('AnimationClip/waist/x/times').val();
				this.keyframetracks[15].values = fss.child('AnimationClip/waist/x/values').val();
				this.keyframetracks[16].times = fss.child('AnimationClip/waist/y/times').val();
				this.keyframetracks[16].values = fss.child('AnimationClip/waist/y/values').val();
				this.keyframetracks[17].times = fss.child('AnimationClip/waist/z/times').val();
				this.keyframetracks[17].values = fss.child('AnimationClip/waist/z/values').val();

				this.keyframetracks[18].times = fss.child('AnimationClip/right_foot_1/x/times').val();
				this.keyframetracks[18].values = fss.child('AnimationClip/right_foot_1/x/values').val();
				this.keyframetracks[19].times = fss.child('AnimationClip/right_foot_1/y/times').val();
				this.keyframetracks[19].values = fss.child('AnimationClip/right_foot_1/y/values').val();
				this.keyframetracks[20].times = fss.child('AnimationClip/right_foot_1/z/times').val();
				this.keyframetracks[20].values = fss.child('AnimationClip/right_foot_1/z/values').val();

				this.keyframetracks[21].times = fss.child('AnimationClip/right_foot_2/x/times').val();
				this.keyframetracks[21].values = fss.child('AnimationClip/right_foot_2/x/values').val();
				this.keyframetracks[22].times = fss.child('AnimationClip/right_foot_2/y/times').val();
				this.keyframetracks[22].values = fss.child('AnimationClip/right_foot_2/y/values').val();
				this.keyframetracks[23].times = fss.child('AnimationClip/right_foot_2/z/times').val();
				this.keyframetracks[23].values = fss.child('AnimationClip/right_foot_2/z/values').val();

				this.keyframetracks[24].times = fss.child('AnimationClip/left_foot_1/x/times').val();
				this.keyframetracks[24].values = fss.child('AnimationClip/left_foot_1/x/values').val();
				this.keyframetracks[25].times = fss.child('AnimationClip/left_foot_1/y/times').val();
				this.keyframetracks[25].values = fss.child('AnimationClip/left_foot_1/y/values').val();
				this.keyframetracks[26].times = fss.child('AnimationClip/left_foot_1/z/times').val();
				this.keyframetracks[26].values = fss.child('AnimationClip/left_foot_1/z/values').val();

				this.keyframetracks[27].times = fss.child('AnimationClip/left_foot_2/x/times').val();
				this.keyframetracks[27].values = fss.child('AnimationClip/left_foot_2/x/values').val();
				this.keyframetracks[28].times = fss.child('AnimationClip/left_foot_2/y/times').val();
				this.keyframetracks[28].values = fss.child('AnimationClip/left_foot_2/y/values').val();
				this.keyframetracks[29].times = fss.child('AnimationClip/left_foot_2/z/times').val();
				this.keyframetracks[29].values = fss.child('AnimationClip/left_foot_2/z/values').val();



				//clipJSONをkeyframetracksから作成
				var clipJSON_Human = {
					duration: -1,
					name:"human_animation",
					tracks: [
						this.keyframetracks[0],
						this.keyframetracks[1],
						this.keyframetracks[2],

						this.keyframetracks[15],
						this.keyframetracks[16],
						this.keyframetracks[17]
					]
				};
				var clipJSON_RightArm = {
					duration: -1,
					name:"right_arm_animation",
					tracks: [
						this.keyframetracks[3],
						this.keyframetracks[4],
						this.keyframetracks[5],

						this.keyframetracks[6],
						this.keyframetracks[7],
						this.keyframetracks[8]
					]
				};
				var clipJSON_LeftArm = {
					duration: -1,
					name:"left_arm_animation",
					tracks: [
						this.keyframetracks[9],
						this.keyframetracks[10],
						this.keyframetracks[11],

						this.keyframetracks[12],
						this.keyframetracks[13],
						this.keyframetracks[14]
					]
				};
				var clipJSON_RightFoot = {
					duration: -1,
					name:"right_foot_animation",
					tracks: [
						this.keyframetracks[18],
						this.keyframetracks[19],
						this.keyframetracks[20],

						this.keyframetracks[21],
						this.keyframetracks[22],
						this.keyframetracks[23]
					]
				};
				var clipJSON_LeftFoot = {
					duration: -1,
					name:"left_foot_animation",
					tracks: [
						this.keyframetracks[24],
						this.keyframetracks[25],
						this.keyframetracks[26],

						this.keyframetracks[27],
						this.keyframetracks[28],
						this.keyframetracks[29]
					]
				};


				var clip_Human = THREE.AnimationClip.parse(clipJSON_Human);
				var clip_RightArm = THREE.AnimationClip.parse(clipJSON_RightArm);
				var clip_LeftArm = THREE.AnimationClip.parse(clipJSON_LeftArm);
				var clip_RightFoot = THREE.AnimationClip.parse(clipJSON_RightFoot);
				var clip_LeftFoot = THREE.AnimationClip.parse(clipJSON_LeftFoot);
				this.clips.push(clip_Human);
				this.clips.push(clip_RightArm);
				this.clips.push(clip_LeftArm);
				this.clips.push(clip_RightFoot);
				this.clips.push(clip_LeftFoot);


				var human_mixer = new THREE.AnimationMixer(this.human);
		    var right_arm_mixer = new THREE.AnimationMixer(right_arm_1);
		    var left_arm_mixer = new THREE.AnimationMixer(left_arm_1);
		    var right_foot_mixer = new THREE.AnimationMixer(right_foot_1);
		    var left_foot_mixer = new THREE.AnimationMixer(left_foot_1);
				this.mixers.push(human_mixer);
				this.mixers.push(right_arm_mixer);
				this.mixers.push(left_arm_mixer);
				this.mixers.push(right_foot_mixer);
				this.mixers.push(left_foot_mixer);


		    var human_action = this.mixers[0].clipAction(this.clips[0]);
		    var right_arm_action = this.mixers[1].clipAction(this.clips[1]);
				var left_arm_action = this.mixers[2].clipAction(this.clips[2]);
				var right_foot_action = this.mixers[3].clipAction(this.clips[3]);
				var left_foot_action = this.mixers[4].clipAction(this.clips[4]);
				//ループ設定(１回のみ)
				human_action.setLoop(THREE.LoopOnce);
				right_arm_action.setLoop(THREE.LoopOnce);
				left_arm_action.setLoop(THREE.LoopOnce);
				right_foot_action.setLoop(THREE.LoopOnce);
				left_foot_action.setLoop(THREE.LoopOnce);
				this.actions.push(human_action);
				this.actions.push(right_arm_action);
				this.actions.push(left_arm_action);
				this.actions.push(right_foot_action);
				this.actions.push(left_foot_action);


		    this.actions[0].play();
		    this.actions[1].play();
				this.actions[2].play();
				this.actions[3].play();
				this.actions[4].play();


				this.controls.update();
        this.renderer.render(this.scene, this.camera);

				//this.animate();

      }
    });
  };

  function waitRTDBload(){
    database.ref('/student').on('value',function(snapshot){
      if(!first){
        vm.changed_DB_bySomeone(snapshot);
      }else{
        createV(snapshot);
        first = false;
      }
    });
  };

  waitRTDBload();
}
